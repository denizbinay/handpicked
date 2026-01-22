<script setup lang="ts">
import type { Channel, ChannelScheduleItem, ChannelTimeline, PlaybackState } from '~/types/database'

const supabase = useSupabaseClient()
const router = useRouter()

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
const schedule = ref<ChannelScheduleItem[]>([])
const timeline = ref<ChannelTimeline | null>(null)
const playbackState = ref<PlaybackState | null>(null)
const errorMessage = ref<string | null>(null)
const showChannelList = ref(true)

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
        <h1>No Channels</h1>
        <p>No public channels available yet.</p>
      </div>
    </div>

    <!-- Main Player View -->
    <div v-else class="player-view">
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
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.error-screen,
.empty-screen {
  flex: 1;
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

.error-content p,
.empty-content p {
  color: #888;
  font-size: 14px;
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
