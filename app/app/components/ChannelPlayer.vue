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
const playerContainer = ref<HTMLElement | null>(null)

// Player state
const isMuted = ref(true)
const isPaused = ref(false)
const isLoading = ref(true)
const isFullscreen = ref(false)
const volume = ref(100)
const currentState = ref<PlaybackState | null>(null)

// Track if user has ever unmuted (for showing initial unmute prompt)
const hasEverUnmuted = ref(false)

// Quality state
const availableQualities = ref<string[]>([])
const currentQuality = ref('auto')
const showQualityMenu = ref(false)

// Quality labels for display
const qualityLabels: Record<string, string> = {
  highres: '4K+',
  hd2160: '4K',
  hd1440: '1440p',
  hd1080: '1080p',
  hd720: '720p',
  large: '480p',
  medium: '360p',
  small: '240p',
  tiny: '144p',
  auto: 'Auto',
}

let advanceTimer: ReturnType<typeof setTimeout> | null = null
let wasPaused = false
let currentVideoId: string | null = null

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
    youtube.loadVideo(state.currentVideo.youtube_video_id, state.offsetSeconds)
    // Try to maintain unmuted state across channel switches
    tryAutoUnmute()
  } else {
    youtube.seekTo(state.offsetSeconds)
  }

  scheduleNextVideo(state)
}

/**
 * Try to unmute if user has previously unmuted (browser may allow after interaction)
 */
function tryAutoUnmute() {
  if (hasEverUnmuted.value && isMuted.value) {
    // Small delay to let video load
    setTimeout(() => {
      try {
        youtube.unmute()
        youtube.setVolume(volume.value)
        isMuted.value = false
      } catch {
        // Browser blocked autoplay with sound, stay muted
        isMuted.value = true
      }
    }, 100)
  }
}

/**
 * Seek to current timeline position without reloading video
 */
function seekToCurrentPosition() {
  const state = calculatePlaybackState(props.schedule, props.timeline)
  if (!state) return

  if (!currentState.value || state.currentVideoIndex !== currentState.value.currentVideoIndex) {
    syncToTimeline()
    return
  }

  youtube.seekTo(state.offsetSeconds)
  currentState.value = state
  emit('playback-state', state)
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

  youtube.loadVideo(video.youtube_video_id, 0)
  scheduleNextVideo(currentState.value)
}

/**
 * Handle YouTube player state changes
 */
function onPlayerStateChange(state: number) {
  if (state === PlayerState.ENDED) {
    advanceToNextVideo()
  } else if (state === PlayerState.PLAYING) {
    isLoading.value = false
    isPaused.value = false

    // Update available qualities when video starts playing
    updateAvailableQualities()

    if (wasPaused) {
      wasPaused = false
      seekToCurrentPosition()
    }
  } else if (state === PlayerState.PAUSED) {
    wasPaused = true
    isPaused.value = true
  } else if (state === PlayerState.BUFFERING) {
    isLoading.value = true
  }
}

/**
 * Handle YouTube player errors
 */
function onPlayerError(errorCode: number) {
  console.error('YouTube player error:', errorCode)
  advanceToNextVideo()
}

/**
 * Update available quality levels
 */
function updateAvailableQualities() {
  const qualities = youtube.getAvailableQualityLevels()
  availableQualities.value = qualities.length > 0 ? qualities : ['auto']
  currentQuality.value = youtube.getPlaybackQuality() || 'auto'
}

/**
 * Handle initial unmute click (the big button)
 */
function handleInitialUnmute() {
  youtube.unmute()
  youtube.setVolume(volume.value)
  isMuted.value = false
  hasEverUnmuted.value = true
}

/**
 * Toggle mute state
 */
function toggleMute() {
  if (isMuted.value) {
    youtube.unmute()
    youtube.setVolume(volume.value)
    isMuted.value = false
    hasEverUnmuted.value = true
  } else {
    youtube.mute()
    isMuted.value = true
  }
}

/**
 * Handle volume change from slider
 */
function handleVolumeChange(event: Event) {
  const target = event.target as HTMLInputElement
  const newVolume = parseInt(target.value)
  volume.value = newVolume
  youtube.setVolume(newVolume)

  // Auto-unmute when adjusting volume
  if (isMuted.value && newVolume > 0) {
    youtube.unmute()
    isMuted.value = false
    hasEverUnmuted.value = true
  }

  // Auto-mute when volume is 0
  if (newVolume === 0) {
    isMuted.value = true
  }
}

/**
 * Toggle play/pause - resume syncs to live timeline
 */
function togglePlayPause() {
  if (isPaused.value) {
    youtube.play()
  } else {
    youtube.pause()
    isPaused.value = true
  }
}

/**
 * Set video quality
 */
function setQuality(quality: string) {
  youtube.setPlaybackQuality(quality)
  currentQuality.value = quality
  showQualityMenu.value = false
}

/**
 * Toggle fullscreen mode
 */
async function toggleFullscreen() {
  if (!playerContainer.value) return

  if (!document.fullscreenElement) {
    await playerContainer.value.requestFullscreen()
    isFullscreen.value = true
  } else {
    await document.exitFullscreen()
    isFullscreen.value = false
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// Close quality menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.quality-selector')) {
    showQualityMenu.value = false
  }
}

onMounted(async () => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('click', handleClickOutside)

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

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('click', handleClickOutside)
  if (advanceTimer) {
    clearTimeout(advanceTimer)
  }
  youtube.destroy()
})

watch(
  () => [props.schedule, props.timeline],
  () => {
    syncToTimeline()
  },
  { deep: true }
)
</script>

<template>
  <div ref="playerContainer" class="channel-player">
    <!-- YouTube Player Container -->
    <div class="player-wrapper">
      <div :id="playerElementId" class="player"></div>

      <!-- Loading Overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>

      <!-- Initial Unmute Prompt (shown until first unmute) -->
      <button
        v-if="isMuted && !hasEverUnmuted && !isLoading"
        class="unmute-prompt"
        @click="handleInitialUnmute"
      >
        <span class="unmute-icon">🔇</span>
        <span class="unmute-text">Click to unmute</span>
      </button>

      <!-- Control Bar -->
      <div class="control-bar" :class="{ 'is-fullscreen': isFullscreen }">
        <!-- Play/Pause -->
        <button
          class="control-btn"
          :title="isPaused ? 'Play (sync to live)' : 'Pause'"
          @click="togglePlayPause"
        >
          <svg v-if="isPaused" class="control-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg v-else class="control-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>

        <!-- Volume Control -->
        <div class="volume-control">
          <button
            class="control-btn"
            :title="isMuted ? 'Unmute' : 'Mute'"
            @click="toggleMute"
          >
            <svg v-if="isMuted || volume === 0" class="control-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
            <svg v-else-if="volume < 50" class="control-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            </svg>
            <svg v-else class="control-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          <input
            type="range"
            class="volume-slider"
            min="0"
            max="100"
            :value="volume"
            @input="handleVolumeChange"
          />
        </div>

        <!-- Spacer -->
        <div class="spacer"></div>

        <!-- Quality Selector -->
        <div class="quality-selector">
          <button
            class="control-btn quality-btn"
            title="Video quality"
            @click.stop="showQualityMenu = !showQualityMenu"
          >
            <span class="quality-label">{{ qualityLabels[currentQuality] || currentQuality }}</span>
          </button>
          <div v-if="showQualityMenu" class="quality-menu">
            <button
              v-for="quality in availableQualities"
              :key="quality"
              class="quality-option"
              :class="{ active: quality === currentQuality }"
              @click="setQuality(quality)"
            >
              {{ qualityLabels[quality] || quality }}
            </button>
          </div>
        </div>

        <!-- Fullscreen -->
        <button
          class="control-btn"
          :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          @click="toggleFullscreen"
        >
          <svg v-if="isFullscreen" class="control-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
          </svg>
          <svg v-else class="control-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          </svg>
        </button>
      </div>

      <!-- Paused Overlay -->
      <div v-if="isPaused && !isLoading" class="paused-overlay">
        <div class="paused-message">
          <svg class="paused-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
          <span>Paused</span>
          <span class="paused-hint">Press play to sync back to live</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.channel-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--color-bg-primary);
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
  background: rgba(9, 8, 7, 0.82);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(244, 239, 230, 0.15);
  border-top-color: var(--color-text-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Initial Unmute Prompt */
.unmute-prompt {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 28px;
  background: rgba(12, 11, 9, 0.9);
  border: 1px solid rgba(215, 161, 103, 0.35);
  border-radius: 999px;
  color: var(--color-text-primary);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.unmute-prompt:hover {
  background: rgba(12, 11, 9, 0.98);
  border-color: rgba(215, 161, 103, 0.6);
}

.unmute-icon {
  font-size: 24px;
}

.unmute-text {
  font-weight: 500;
}

/* Control Bar */
.control-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: linear-gradient(transparent 0%, rgba(9, 8, 7, 0.7) 30%, rgba(9, 8, 7, 0.92) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.channel-player:hover .control-bar,
.control-bar.is-fullscreen {
  opacity: 1;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 40px;
  padding: 0 14px;
  background: rgba(244, 239, 230, 0.12);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(244, 239, 230, 0.12);
  border-radius: 10px;
  color: var(--color-text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.control-btn:hover {
  background: rgba(215, 161, 103, 0.22);
  border-color: rgba(215, 161, 103, 0.5);
}

.control-icon {
  width: 22px;
  height: 22px;
}

.spacer {
  flex: 1;
}

/* Volume Control */
.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 80px;
  height: 4px;
  appearance: none;
  background: rgba(244, 239, 230, 0.25);
  border-radius: 2px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, width 0.2s;
}

.volume-control:hover .volume-slider,
.volume-slider:focus {
  opacity: 1;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--color-text-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.volume-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--color-text-primary);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* Quality Selector */
.quality-selector {
  position: relative;
}

.quality-btn {
  min-width: 70px;
}

.quality-label {
  font-size: 13px;
  font-weight: 500;
}

.quality-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background: rgba(12, 11, 9, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(244, 239, 230, 0.12);
  border-radius: 12px;
  overflow: hidden;
  min-width: 120px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.quality-option {
  display: block;
  width: 100%;
  padding: 12px 18px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.quality-option:hover {
  background: rgba(215, 161, 103, 0.12);
  color: var(--color-text-primary);
}

.quality-option.active {
  color: var(--color-accent);
  font-weight: 500;
}

/* Paused Overlay */
.paused-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(9, 8, 7, 0.6);
  pointer-events: none;
}

.paused-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 500;
}

.paused-icon {
  width: 64px;
  height: 64px;
  opacity: 0.8;
}

.paused-hint {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-tertiary);
}
</style>
