<script setup lang="ts">
import type { Channel, ChannelScheduleItem, ChannelTimeline, PlaybackState, CreatorProfile } from '~/types/database'

const supabase = useSupabaseClient()

// Fetch all public channels
const { data: channels, error: channelsError } = await useAsyncData('channels', async () => {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Channel[]
})

// Current channel state
const currentChannel = ref<Channel | null>(null)
const currentCreator = ref<CreatorProfile | null>(null)
const schedule = ref<ChannelScheduleItem[]>([])
const timeline = ref<ChannelTimeline | null>(null)
const playbackState = ref<PlaybackState | null>(null)
const errorMessage = ref<string | null>(null)
const showChannelList = ref(true)
const showScheduleModal = ref(false)

// Computed: next video based on playback state
const nextVideo = computed(() => {
  if (!playbackState.value || !schedule.value.length) return null
  const nextIndex = playbackState.value.currentVideoIndex + 1
  if (nextIndex >= schedule.value.length) return null
  return schedule.value[nextIndex] ?? null
})

/**
 * Load a channel by slug
 */
async function loadChannel(slug: string) {
  errorMessage.value = null

  // Find channel
  const channel = channels.value?.find((c) => c.slug === slug)
  if (!channel) {
    errorMessage.value = 'Channel not found'
    return
  }

  currentChannel.value = channel

  // Fetch creator profile
  const { data: creatorData } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('id', channel.created_by)
    .single()

  currentCreator.value = creatorData as CreatorProfile | null

  // Fetch schedule
  const { data: scheduleData, error: scheduleError } = await supabase
    .from('channel_schedules')
    .select('*')
    .eq('channel_id', channel.id)
    .order('position', { ascending: true })

  if (scheduleError) {
    errorMessage.value = 'Failed to load schedule'
    return
  }

  schedule.value = scheduleData as ChannelScheduleItem[]

  // Fetch timeline
  const { data: timelineData, error: timelineError } = await supabase
    .from('channel_timelines')
    .select('*')
    .eq('channel_id', channel.id)
    .single()

  if (timelineError || !timelineData) {
    errorMessage.value = 'Channel has no timeline'
    return
  }

  timeline.value = timelineData as ChannelTimeline

  // Update URL without navigation
  window.history.replaceState({}, '', `/${slug}`)
}

/**
 * Handle channel selection
 */
function selectChannel(slug: string) {
  loadChannel(slug)
}

/**
 * Handle playback state updates
 */
function onPlaybackState(state: PlaybackState) {
  playbackState.value = state
}

/**
 * Handle player errors
 */
function onPlayerError(error: string) {
  errorMessage.value = error
}

/**
 * Keyboard shortcuts for channel switching
 */
function handleKeydown(event: KeyboardEvent) {
  // Number keys 1-9 for channel switching
  const num = parseInt(event.key)
  if (num >= 1 && num <= 9 && channels.value) {
    const channel = channels.value[num - 1]
    if (channel) {
      selectChannel(channel.slug)
    }
  }

  // Toggle channel list with Tab or C
  if (event.key === 'Tab' || event.key === 'c') {
    event.preventDefault()
    showChannelList.value = !showChannelList.value
  }
}

// Auto-load first channel on mount
onMounted(() => {
  if (channels.value && channels.value.length > 0) {
    loadChannel(channels.value[0].slug)
  }

  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="app">
    <!-- Error State -->
    <div v-if="channelsError || errorMessage" class="error-screen">
      <div class="error-content">
        <h1>Error</h1>
        <p>{{ channelsError?.message || errorMessage }}</p>
      </div>
    </div>

    <!-- No Channels State -->
    <div v-else-if="!channels || channels.length === 0" class="empty-screen">
      <div class="empty-content">
        <h1 class="brand">Handpicked</h1>
        <p class="tagline">Curated TV for the internet</p>

        <div class="explanation">
          <p>
            Handpicked is like television &mdash; you tune in, something is playing,
            and you can't skip ahead. Channels are curated by humans,
            not algorithms.
          </p>
        </div>

        <div class="status">
          <span class="status-dot"></span>
          No channels are live yet
        </div>

        <p class="curator-cta">
          Are you a curator? <NuxtLink to="/curator/login">Sign in</NuxtLink>
        </p>
      </div>
    </div>

    <!-- Main Player View -->
    <div v-else class="player-page">
      <!-- Above the Fold (100vh) -->
      <div class="above-the-fold">
        <div class="player-view">
          <!-- Player -->
          <div class="player-container">
            <ChannelPlayer
              v-if="schedule.length > 0 && timeline"
              :schedule="schedule"
              :timeline="timeline"
              @playback-state="onPlaybackState"
              @error="onPlayerError"
            />

            <!-- Now Playing Bar -->
            <NowPlaying
              v-if="currentChannel"
              :channel-title="currentChannel.title"
              :state="playbackState"
              :next-video="nextVideo"
              @show-schedule="showScheduleModal = true"
            />
          </div>

          <!-- Channel List Sidebar -->
          <transition name="slide">
            <ChannelList
              v-if="showChannelList"
              :channels="channels"
              :current-slug="currentChannel?.slug ?? null"
              @select="selectChannel"
            />
          </transition>
        </div>
      </div>

      <!-- Below the Fold -->
      <BelowTheFold :channel="currentChannel" :creator="currentCreator" />

      <!-- Schedule Modal -->
      <ScheduleModal
        v-if="showScheduleModal"
        :schedule="schedule"
        :timeline="timeline"
        :playback-state="playbackState"
        @close="showScheduleModal = false"
      />
    </div>
  </div>
</template>

<style>
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#__nuxt {
  height: 100%;
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
}

.error-screen,
.empty-screen {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.error-content,
.empty-content {
  max-width: 400px;
  padding: 32px;
}

.error-content h1,
.empty-content h1 {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 12px;
}

.error-content p {
  color: #888;
  font-size: 14px;
}

.empty-content .brand {
  font-size: 42px;
  font-weight: 600;
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}

.empty-content .tagline {
  font-size: 18px;
  color: #4af;
  margin-bottom: 32px;
}

.empty-content .explanation {
  max-width: 360px;
  margin-bottom: 32px;
}

.empty-content .explanation p {
  font-size: 15px;
  color: #888;
  line-height: 1.6;
}

.empty-content .status {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #333;
  border-radius: 24px;
  font-size: 14px;
  color: #666;
  margin-bottom: 32px;
}

.empty-content .status-dot {
  width: 8px;
  height: 8px;
  background: #666;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.empty-content .curator-cta {
  font-size: 13px;
  color: #555;
}

.empty-content .curator-cta a {
  color: #888;
  text-decoration: none;
}

.empty-content .curator-cta a:hover {
  color: #fff;
  text-decoration: underline;
}

.player-page {
  min-height: 100vh;
}

.above-the-fold {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.player-view {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.player-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Slide transition for channel list */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
