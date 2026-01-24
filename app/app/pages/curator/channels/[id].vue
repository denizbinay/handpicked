<script setup lang="ts">
import type { Channel, ChannelScheduleItem, ChannelTimeline, ChannelCategory } from '~/types/database'

const CATEGORIES: { value: ChannelCategory; label: string }[] = [
  { value: 'tech', label: 'Tech' },
  { value: 'music', label: 'Music' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'art', label: 'Art' },
  { value: 'science', label: 'Science' },
  { value: 'news', label: 'News' },
]

definePageMeta({
  middleware: 'curator-auth',
})

const route = useRoute()
const supabase = useSupabaseClient()

const channelId = computed(() => route.params.id as string)

// Channel data
const channel = ref<Channel | null>(null)
const schedule = ref<ChannelScheduleItem[]>([])
const timeline = ref<ChannelTimeline | null>(null)

// Form state
const isEditing = ref(false)
const editTitle = ref('')
const editDescription = ref('')
const editIsPublic = ref(false)
const editCategory = ref<ChannelCategory | null>(null)

// Add video state
const newVideoUrl = ref('')
const isAddingVideo = ref(false)
const addVideoError = ref<string | null>(null)

// Loading states
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)

// Fetch channel data
async function fetchChannel() {
  isLoading.value = true
  error.value = null

  try {
    // Get current session to verify ownership
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id

    if (!userId) {
      error.value = 'You must be logged in'
      return
    }

    // Fetch channel
    const { data: channelData, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId.value)
      .single()

    if (channelError || !channelData) {
      error.value = 'Channel not found'
      return
    }

    // Verify ownership
    if (channelData.created_by !== userId) {
      error.value = 'You do not have access to this channel'
      return
    }

    channel.value = channelData as Channel
    editTitle.value = channelData.title
    editDescription.value = channelData.description || ''
    editIsPublic.value = channelData.is_public
    editCategory.value = channelData.category || null

    // Fetch schedule
    const { data: scheduleData } = await supabase
      .from('channel_schedules')
      .select('*')
      .eq('channel_id', channelId.value)
      .order('position', { ascending: true })

    schedule.value = (scheduleData || []) as ChannelScheduleItem[]

    // Fetch timeline
    const { data: timelineData } = await supabase
      .from('channel_timelines')
      .select('*')
      .eq('channel_id', channelId.value)
      .single()

    timeline.value = timelineData as ChannelTimeline | null
  } catch (err) {
    error.value = 'Failed to load channel'
  } finally {
    isLoading.value = false
  }
}

// Save channel metadata
async function saveMetadata() {
  if (!channel.value) return

  isSaving.value = true

  const { error: updateError } = await supabase
    .from('channels')
    .update({
      title: editTitle.value,
      description: editDescription.value || null,
      is_public: editIsPublic.value,
      category: editCategory.value,
    })
    .eq('id', channelId.value)

  isSaving.value = false

  if (updateError) {
    alert('Failed to save changes')
    return
  }

  channel.value.title = editTitle.value
  channel.value.description = editDescription.value
  channel.value.is_public = editIsPublic.value
  channel.value.category = editCategory.value
  isEditing.value = false
}

// Add video to schedule
async function addVideo() {
  if (!newVideoUrl.value) return

  isAddingVideo.value = true
  addVideoError.value = null

  try {
    // Fetch video info from YouTube API
    const videoInfo = await $fetch('/api/youtube/video', {
      params: { id: newVideoUrl.value },
    })

    // Add to schedule
    const newPosition = schedule.value.length

    const { data: newItem, error: insertError } = await supabase
      .from('channel_schedules')
      .insert({
        channel_id: channelId.value,
        position: newPosition,
        youtube_video_id: videoInfo.id,
        title: videoInfo.title,
        duration_seconds: videoInfo.duration_seconds,
        youtube_channel_name: videoInfo.channelTitle,
        youtube_channel_id: videoInfo.channelId,
        thumbnail_url: videoInfo.thumbnail,
        published_at: videoInfo.publishedAt,
      })
      .select()
      .single()

    if (insertError) {
      addVideoError.value = 'Failed to add video'
      return
    }

    schedule.value.push(newItem as ChannelScheduleItem)
    newVideoUrl.value = ''
  } catch (err: any) {
    addVideoError.value = err.data?.message || 'Failed to fetch video info'
  } finally {
    isAddingVideo.value = false
  }
}

// Remove video from schedule
async function removeVideo(index: number) {
  const item = schedule.value[index]

  const { error: deleteError } = await supabase
    .from('channel_schedules')
    .delete()
    .eq('id', item.id)

  if (deleteError) {
    alert('Failed to remove video')
    return
  }

  // Remove from local state and reorder
  schedule.value.splice(index, 1)

  // Update positions
  for (let i = index; i < schedule.value.length; i++) {
    await supabase
      .from('channel_schedules')
      .update({ position: i })
      .eq('id', schedule.value[i].id)

    schedule.value[i].position = i
  }
}

// Move video up in schedule
async function moveUp(index: number) {
  if (index === 0) return

  const item = schedule.value[index]
  const prevItem = schedule.value[index - 1]

  // Swap positions in DB
  await Promise.all([
    supabase
      .from('channel_schedules')
      .update({ position: index - 1 })
      .eq('id', item.id),
    supabase
      .from('channel_schedules')
      .update({ position: index })
      .eq('id', prevItem.id),
  ])

  // Swap in local state
  schedule.value[index] = prevItem
  schedule.value[index - 1] = item
  schedule.value[index].position = index
  schedule.value[index - 1].position = index - 1
}

// Move video down in schedule
async function moveDown(index: number) {
  if (index === schedule.value.length - 1) return

  const item = schedule.value[index]
  const nextItem = schedule.value[index + 1]

  // Swap positions in DB
  await Promise.all([
    supabase
      .from('channel_schedules')
      .update({ position: index + 1 })
      .eq('id', item.id),
    supabase
      .from('channel_schedules')
      .update({ position: index })
      .eq('id', nextItem.id),
  ])

  // Swap in local state
  schedule.value[index] = nextItem
  schedule.value[index + 1] = item
  schedule.value[index].position = index
  schedule.value[index + 1].position = index + 1
}

// Reset timeline (restart channel from now)
async function resetTimeline() {
  if (!confirm('Reset timeline? The channel will restart from the beginning.')) {
    return
  }

  const now = new Date().toISOString()

  if (timeline.value) {
    await supabase
      .from('channel_timelines')
      .update({ start_time: now })
      .eq('channel_id', channelId.value)

    timeline.value.start_time = now
  } else {
    await supabase.from('channel_timelines').insert({
      channel_id: channelId.value,
      start_time: now,
    })

    timeline.value = { channel_id: channelId.value, start_time: now }
  }
}

// Format duration
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Total schedule duration
const totalDuration = computed(() => {
  return schedule.value.reduce((sum, item) => sum + item.duration_seconds, 0)
})

// Load on mount
onMounted(() => {
  fetchChannel()
})
</script>

<template>
  <div class="curator-page">
    <header class="header">
      <NuxtLink to="/curator" class="back-link">&larr; Back to Dashboard</NuxtLink>
    </header>

    <main class="main">
      <!-- Loading -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <NuxtLink to="/curator" class="back-link">Back to Dashboard</NuxtLink>
      </div>

      <!-- Channel Editor -->
      <div v-else-if="channel" class="channel-editor">
        <!-- Channel Info Section -->
        <section class="section">
          <div class="section-header">
            <h2>Channel Info</h2>
            <button
              v-if="!isEditing"
              class="edit-button"
              @click="isEditing = true"
            >
              Edit
            </button>
          </div>

          <div v-if="!isEditing" class="channel-info">
            <div class="info-row">
              <span class="label">Title</span>
              <span class="value">{{ channel.title }}</span>
            </div>
            <div class="info-row">
              <span class="label">URL</span>
              <span class="value mono">/{{ channel.slug }}</span>
            </div>
            <div class="info-row">
              <span class="label">Description</span>
              <span class="value">{{ channel.description || 'No description' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Category</span>
              <span class="value">
                <span v-if="channel.category" class="category-badge">
                  {{ CATEGORIES.find(c => c.value === channel.category)?.label || channel.category }}
                </span>
                <span v-else class="empty">Not set</span>
              </span>
            </div>
            <div class="info-row">
              <span class="label">Status</span>
              <span class="value">
                <span class="status-badge" :class="{ public: channel.is_public }">
                  {{ channel.is_public ? 'Public' : 'Private' }}
                </span>
              </span>
            </div>
          </div>

          <form v-else class="edit-form" @submit.prevent="saveMetadata">
            <div class="form-group">
              <label>Title</label>
              <input v-model="editTitle" type="text" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="editDescription" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Category</label>
              <select v-model="editCategory">
                <option :value="null">Select a category...</option>
                <option v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value">
                  {{ cat.label }}
                </option>
              </select>
            </div>
            <div class="form-group checkbox">
              <input id="edit-public" v-model="editIsPublic" type="checkbox" />
              <label for="edit-public">Public</label>
            </div>
            <div class="form-actions">
              <button
                type="button"
                class="cancel-button"
                @click="isEditing = false"
              >
                Cancel
              </button>
              <button type="submit" class="save-button" :disabled="isSaving">
                {{ isSaving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </section>

        <!-- Schedule Section -->
        <section class="section">
          <div class="section-header">
            <h2>Schedule</h2>
            <span class="schedule-stats">
              {{ schedule.length }} videos &middot; {{ formatDuration(totalDuration) }} total
            </span>
          </div>

          <!-- Add Video -->
          <div class="add-video">
            <input
              v-model="newVideoUrl"
              type="text"
              placeholder="Paste YouTube URL or video ID"
              :disabled="isAddingVideo"
              @keyup.enter="addVideo"
            />
            <button
              class="add-button"
              :disabled="isAddingVideo || !newVideoUrl"
              @click="addVideo"
            >
              {{ isAddingVideo ? 'Adding...' : 'Add' }}
            </button>
          </div>
          <div v-if="addVideoError" class="add-error">{{ addVideoError }}</div>

          <!-- Video List -->
          <div v-if="schedule.length === 0" class="empty-schedule">
            <p>No videos in schedule. Add some videos above.</p>
          </div>

          <ul v-else class="schedule-list">
            <li
              v-for="(item, index) in schedule"
              :key="item.id"
              class="schedule-item"
            >
              <span class="item-position">{{ index + 1 }}</span>
              <div class="item-info">
                <span class="item-title">{{ item.title || item.youtube_video_id }}</span>
                <span class="item-duration">{{ formatDuration(item.duration_seconds) }}</span>
              </div>
              <div class="item-actions">
                <button
                  class="move-button"
                  :disabled="index === 0"
                  @click="moveUp(index)"
                >
                  &uarr;
                </button>
                <button
                  class="move-button"
                  :disabled="index === schedule.length - 1"
                  @click="moveDown(index)"
                >
                  &darr;
                </button>
                <button class="remove-button" @click="removeVideo(index)">
                  &times;
                </button>
              </div>
            </li>
          </ul>
        </section>

        <!-- Timeline Section -->
        <section class="section">
          <div class="section-header">
            <h2>Timeline</h2>
          </div>

          <div class="timeline-info">
            <div class="info-row">
              <span class="label">Started</span>
              <span class="value">
                {{
                  timeline
                    ? new Date(timeline.start_time).toLocaleString()
                    : 'Not started'
                }}
              </span>
            </div>
            <button class="reset-button" @click="resetTimeline">
              Reset Timeline (Restart Now)
            </button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.curator-page {
  min-height: 100vh;
  background: #0a0a0a;
  color: #fff;
}

.header {
  padding: 16px 24px;
  border-bottom: 1px solid #222;
}

.back-link {
  color: #888;
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  color: #fff;
}

.main {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 24px;
}

.loading {
  text-align: center;
  color: #888;
  padding: 48px;
}

.error-state {
  text-align: center;
  padding: 48px;
}

.error-state p {
  color: #f55;
  margin-bottom: 16px;
}

.channel-editor {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section {
  background: #111;
  border: 1px solid #222;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #222;
}

.section-header h2 {
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
}

.schedule-stats {
  font-size: 12px;
  color: #555;
}

.edit-button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #333;
  border-radius: 4px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
}

.edit-button:hover {
  border-color: #555;
  color: #fff;
}

.channel-info,
.timeline-info {
  padding: 20px;
}

.info-row {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}

.info-row .label {
  width: 100px;
  color: #555;
  font-size: 13px;
}

.info-row .value {
  color: #ccc;
  font-size: 13px;
}

.info-row .value.mono {
  font-family: ui-monospace, monospace;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: #333;
  color: #888;
}

.status-badge.public {
  background: rgba(0, 200, 100, 0.1);
  color: #0c8;
}

.category-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: rgba(100, 150, 255, 0.1);
  color: #6af;
}

.form-group select {
  padding: 10px 12px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.form-group select:focus {
  border-color: #555;
  outline: none;
}

.edit-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.form-group label {
  font-size: 12px;
  color: #666;
}

.form-group.checkbox label {
  color: #ccc;
}

.form-group input[type='text'],
.form-group textarea {
  padding: 10px 12px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  font-family: inherit;
}

.form-group input[type='checkbox'] {
  width: 16px;
  height: 16px;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancel-button,
.save-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.cancel-button {
  background: transparent;
  border: 1px solid #333;
  color: #888;
}

.save-button {
  background: #fff;
  border: none;
  color: #000;
  font-weight: 500;
}

.add-video {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid #222;
}

.add-video input {
  flex: 1;
  padding: 10px 12px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
}

.add-button {
  padding: 10px 20px;
  background: #fff;
  border: none;
  border-radius: 4px;
  color: #000;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.add-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-error {
  padding: 8px 20px;
  font-size: 12px;
  color: #f55;
  background: rgba(255, 80, 80, 0.1);
}

.empty-schedule {
  padding: 32px 20px;
  text-align: center;
  color: #555;
  font-size: 13px;
}

.schedule-list {
  list-style: none;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #222;
}

.schedule-item:last-child {
  border-bottom: none;
}

.item-position {
  width: 24px;
  text-align: center;
  color: #555;
  font-size: 12px;
  font-family: ui-monospace, monospace;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  display: block;
  color: #ccc;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-duration {
  font-size: 11px;
  color: #555;
  font-family: ui-monospace, monospace;
}

.item-actions {
  display: flex;
  gap: 4px;
}

.move-button,
.remove-button {
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid #333;
  border-radius: 4px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.move-button:hover:not(:disabled),
.remove-button:hover {
  border-color: #555;
  color: #fff;
}

.move-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.remove-button:hover {
  border-color: #f55;
  color: #f55;
}

.reset-button {
  margin-top: 16px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid #333;
  border-radius: 4px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
}

.reset-button:hover {
  border-color: #f80;
  color: #f80;
}

.preview-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #333;
}

.url-preview {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #666;
}

.empty {
  color: #444;
  font-style: italic;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.form-group input[type='url'] {
  padding: 10px 12px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  font-family: inherit;
  width: 100%;
}
</style>
