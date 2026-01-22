<script setup lang="ts">
import type { ChannelScheduleItem, ChannelTimeline, PlaybackState } from '~/types/database'
import { useChannelTimeline } from '~/composables/useChannelTimeline'
import { useYouTubePlayer, PlayerState } from '~/composables/useYouTubePlayer'

const props = defineProps<{
  schedule: ChannelScheduleItem[]
  timeline: ChannelTimeline
}>()

const emit = defineEmits<{
  (e: 'playback-state', state: PlaybackState): void
  (e: 'error', error: string): void
}>()

const { calculatePlaybackState, getNextVideo, getTimeUntilNextVideo } = useChannelTimeline()
const youtube = useYouTubePlayer()

const playerElementId = 'youtube-player'
const isMuted = ref(true)
const isLoading = ref(true)
const currentState = ref<PlaybackState | null>(null)

let advanceTimer: ReturnType<typeof setTimeout> | null = null
let wasPaused = false
let currentVideoId: string | null = null // Track current video to avoid unnecessary reloads

/**
 * Calculate and sync to current playback position (full reload)
 */
function syncToTimeline() {
  const state = calculatePlaybackState(props.schedule, props.timeline)
  if (!state) {
    emit('error', 'No videos in schedule')
    return
  }

  const needsReload = currentVideoId !== state.currentVideo.youtube_video_id

  currentState.value = state
  currentVideoId = state.currentVideo.youtube_video_id
  emit('playback-state', state)

  if (needsReload) {
    // Different video - load it at the correct offset
    youtube.loadVideo(state.currentVideo.youtube_video_id, state.offsetSeconds)
  } else {
    // Same video - just seek to correct position
    youtube.seekTo(state.offsetSeconds)
  }

  // Schedule advance to next video
  scheduleNextVideo(state)
}

/**
 * Seek to current timeline position without reloading video
 * Used when resuming from pause - only seeks if same video
 */
function seekToCurrentPosition() {
  const state = calculatePlaybackState(props.schedule, props.timeline)
  if (!state) return

  // If we're on a different video now, do a full reload
  if (!currentState.value || state.currentVideoIndex !== currentState.value.currentVideoIndex) {
    syncToTimeline()
    return
  }

  // Same video - just seek to correct position (already playing)
  youtube.seekTo(state.offsetSeconds)

  currentState.value = state
  emit('playback-state', state)

  // Reschedule next video advancement
  scheduleNextVideo(state)
}

/**
 * Schedule automatic advancement to next video
 */
function scheduleNextVideo(state: PlaybackState) {
  if (advanceTimer) {
    clearTimeout(advanceTimer)
  }

  const timeUntilNext = getTimeUntilNextVideo(state.currentVideo, state.offsetSeconds)

  // Add small buffer to account for timing drift
  const delayMs = (timeUntilNext + 0.5) * 1000

  advanceTimer = setTimeout(() => {
    advanceToNextVideo()
  }, delayMs)
}

/**
 * Advance to the next video in schedule
 */
function advanceToNextVideo() {
  if (!currentState.value) return

  const { video, index } = getNextVideo(props.schedule, currentState.value.currentVideoIndex)

  currentState.value = {
    ...currentState.value,
    currentVideo: video,
    currentVideoIndex: index,
    offsetSeconds: 0,
  }

  currentVideoId = video.youtube_video_id
  emit('playback-state', currentState.value)

  // Load next video from the start
  youtube.loadVideo(video.youtube_video_id, 0)

  // Schedule next advancement
  scheduleNextVideo(currentState.value)
}

/**
 * Handle YouTube player state changes
 */
function onPlayerStateChange(state: number) {
  if (state === PlayerState.ENDED) {
    // Video ended - advance to next
    advanceToNextVideo()
  } else if (state === PlayerState.PLAYING) {
    isLoading.value = false

    // If resuming from pause, seek to current timeline position (no reload)
    if (wasPaused) {
      wasPaused = false
      seekToCurrentPosition()
    }
  } else if (state === PlayerState.PAUSED) {
    // Mark that we were paused so we can re-sync on resume
    wasPaused = true
  } else if (state === PlayerState.BUFFERING) {
    isLoading.value = true
  }
}

/**
 * Handle YouTube player errors
 */
function onPlayerError(errorCode: number) {
  console.error('YouTube player error:', errorCode)

  // Skip to next video on error
  advanceToNextVideo()
}

/**
 * Unmute player (requires user interaction)
 */
function handleUnmute() {
  youtube.unmute()
  isMuted.value = false
}

/**
 * Initialize player on mount
 */
onMounted(async () => {
  try {
    await youtube.createPlayer({
      elementId: playerElementId,
      onReady: () => {
        syncToTimeline()
      },
      onStateChange: onPlayerStateChange,
      onError: onPlayerError,
    })
  } catch (error) {
    emit('error', 'Failed to initialize player')
  }
})

/**
 * Cleanup on unmount
 */
onUnmounted(() => {
  if (advanceTimer) {
    clearTimeout(advanceTimer)
  }
  youtube.destroy()
})

/**
 * Re-sync when schedule or timeline changes
 */
watch(
  () => [props.schedule, props.timeline],
  () => {
    syncToTimeline()
  },
  { deep: true }
)
</script>

<template>
  <div class="channel-player">
    <!-- YouTube Player Container -->
    <div class="player-wrapper">
      <div :id="playerElementId" class="player"></div>

      <!-- Loading Overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>

      <!-- Unmute Button (shown when muted) -->
      <button
        v-if="isMuted && !isLoading"
        class="unmute-button"
        @click="handleUnmute"
      >
        Click to unmute
      </button>
    </div>
  </div>
</template>

<style scoped>
.channel-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}

.player-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.player {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #333;
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.unmute-button {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.unmute-button:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
