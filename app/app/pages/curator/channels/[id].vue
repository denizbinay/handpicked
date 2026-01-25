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
const togglingItemId = ref<string | null>(null)

// Loading states
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)

// Fetch channel data
async function fetchChannel() {
  isLoading.value = true
  error.value = null

  try {
    // Get verified user to verify ownership
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

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
    }) as {
      id: string
      title: string
      channelTitle: string
      channelId: string
      publishedAt: string
      duration_seconds: number
      thumbnail: string | null
      embeddable: boolean
      privacyStatus: string
      uploadStatus: string
      isAvailable: boolean
    }

    // Add to schedule (mark disabled if not available)
    const newPosition = schedule.value.length
    const shouldDisable = !videoInfo.isAvailable
    const errorMessage = shouldDisable
      ? `Not embeddable: ${videoInfo.privacyStatus}, embeddable=${videoInfo.embeddable}`
      : null

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
        is_disabled: shouldDisable,
        last_error_message: errorMessage,
        last_checked_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      addVideoError.value = 'Failed to add video'
      return
    }

    schedule.value.push(newItem as ChannelScheduleItem)
    newVideoUrl.value = ''

    if (shouldDisable) {
      addVideoError.value = 'Video added but marked unavailable (not embeddable or private)'
    }
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

async function toggleScheduleItem(item: ChannelScheduleItem) {
  togglingItemId.value = item.id
  const nextValue = !item.is_disabled

  // If re-enabling, recheck availability first
  if (nextValue === false) {
    // Re-enabling: verify video is now available
    try {
      const videoInfo = await $fetch('/api/youtube/video', {
        params: { id: item.youtube_video_id },
      }) as { isAvailable: boolean; embeddable: boolean; privacyStatus: string }

      if (!videoInfo.isAvailable) {
        alert(`Video is still unavailable (embeddable: ${videoInfo.embeddable}, status: ${videoInfo.privacyStatus})`)
        togglingItemId.value = null
        return
      }

      // Update with cleared error fields
      const { error: updateError } = await supabase
        .from('channel_schedules')
        .update({
          is_disabled: false,
          last_error_code: null,
          last_error_message: null,
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      togglingItemId.value = null

      if (updateError) {
        alert('Failed to update video status')
        return
      }

      item.is_disabled = false
      item.last_error_code = undefined
      item.last_error_message = undefined
    } catch {
      alert('Failed to verify video availability')
      togglingItemId.value = null
    }
    return
  }

  // Disabling: just set the flag
  const { error: updateError } = await supabase
    .from('channel_schedules')
    .update({ is_disabled: nextValue })
    .eq('id', item.id)

  togglingItemId.value = null

  if (updateError) {
    alert('Failed to update video status')
    return
  }

  item.is_disabled = nextValue
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
              :class="{ disabled: item.is_disabled }"
            >
              <span class="item-position">{{ index + 1 }}</span>
              <div class="item-info">
                <span class="item-title">{{ item.title || item.youtube_video_id }}</span>
                <span v-if="item.is_disabled" class="item-badge unavailable">Unavailable</span>
                <span v-if="item.last_error_message && item.is_disabled" class="item-error">{{ item.last_error_message }}</span>
                <span class="item-duration">{{ formatDuration(item.duration_seconds) }}</span>
              </div>
              <div class="item-actions">
                <button
                  class="toggle-button"
                  :disabled="togglingItemId === item.id"
                  @click="toggleScheduleItem(item)"
                >
                  {{ item.is_disabled ? 'Enable' : 'Disable' }}
                </button>
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
  background: transparent;
  color: var(--color-text-primary);
}

.header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(244, 239, 230, 0.03), transparent);
}

.back-link {
  color: var(--color-text-tertiary);
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  color: var(--color-text-primary);
}

.main {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 24px;
}

.loading {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: 48px;
}

.error-state {
  text-align: center;
  padding: 48px;
}

.error-state p {
  color: #ef8a7a;
  margin-bottom: 16px;
}

.channel-editor {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section {
  background: rgba(15, 14, 12, 0.85);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.section-header h2 {
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
}

.schedule-stats {
  font-size: 12px;
  color: var(--color-text-muted);
}

.edit-button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  cursor: pointer;
}

.edit-button:hover {
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-text-primary);
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
  color: var(--color-text-muted);
  font-size: 13px;
}

.info-row .value {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.info-row .value.mono {
  font-family: var(--font-mono);
}

.status-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(244, 239, 230, 0.08);
  color: var(--color-text-tertiary);
}

.status-badge.public {
  background: rgba(0, 200, 100, 0.1);
  color: #7fd1a1;
}

.category-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: rgba(215, 161, 103, 0.12);
  color: var(--color-accent);
}

.form-group select {
  padding: 10px 12px;
  background: rgba(11, 10, 8, 0.9);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.form-group select:focus {
  border-color: rgba(215, 161, 103, 0.6);
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
  color: var(--color-text-muted);
}

.form-group.checkbox label {
  color: var(--color-text-secondary);
}

.form-group input[type='text'],
.form-group textarea {
  padding: 10px 12px;
  background: rgba(11, 10, 8, 0.9);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-family: inherit;
}

.form-group input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancel-button,
.save-button {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
}

.cancel-button {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-tertiary);
}

.save-button {
  background: linear-gradient(120deg, rgba(215, 161, 103, 0.95), rgba(111, 196, 184, 0.85));
  border: 1px solid rgba(215, 161, 103, 0.4);
  color: #120f0a;
  font-weight: 500;
  box-shadow: var(--shadow-glow);
}

.add-video {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.add-video input {
  flex: 1;
  padding: 10px 12px;
  background: rgba(11, 10, 8, 0.9);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  font-size: 13px;
}

.add-button {
  padding: 10px 20px;
  background: linear-gradient(120deg, rgba(215, 161, 103, 0.95), rgba(111, 196, 184, 0.85));
  border: 1px solid rgba(215, 161, 103, 0.4);
  border-radius: 999px;
  color: #120f0a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: var(--shadow-glow);
}

.add-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-error {
  padding: 8px 20px;
  font-size: 12px;
  color: #ef8a7a;
  background: rgba(255, 80, 80, 0.1);
}

.empty-schedule {
  padding: 32px 20px;
  text-align: center;
  color: var(--color-text-muted);
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
  border-bottom: 1px solid var(--color-border-subtle);
}

.schedule-item.disabled {
  opacity: 0.6;
}

.schedule-item:last-child {
  border-bottom: none;
}

.item-position {
  width: 24px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
  font-family: var(--font-mono);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  display: block;
  color: var(--color-text-secondary);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  background: rgba(244, 239, 230, 0.08);
  margin-top: 4px;
  width: fit-content;
}

.item-badge.unavailable {
  background: rgba(239, 138, 122, 0.15);
  color: #ef8a7a;
}

.item-error {
  display: block;
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 2px;
  font-style: italic;
}

.item-duration {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.item-actions {
  display: flex;
  gap: 4px;
}

.toggle-button {
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  cursor: pointer;
}

.toggle-button:hover:not(:disabled) {
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-text-primary);
}

.toggle-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.move-button,
.remove-button {
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-muted);
  font-size: 14px;
  cursor: pointer;
}

.move-button:hover:not(:disabled),
.remove-button:hover {
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-text-primary);
}

.move-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.remove-button:hover {
  border-color: rgba(239, 138, 122, 0.8);
  color: #ef8a7a;
}

.reset-button {
  margin-top: 16px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-tertiary);
  font-size: 13px;
  cursor: pointer;
}

.reset-button:hover {
  border-color: rgba(215, 161, 103, 0.8);
  color: var(--color-accent);
}

.preview-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(244, 239, 230, 0.12);
}

.url-preview {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-muted);
}

.empty {
  color: var(--color-text-muted);
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
  background: rgba(11, 10, 8, 0.9);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-family: inherit;
  width: 100%;
}

@media (max-width: 900px) {
  .add-video {
    flex-direction: column;
  }

  .schedule-item {
    flex-wrap: wrap;
  }

  .item-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .main {
    padding: 24px 16px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
