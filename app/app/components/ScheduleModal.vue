<script setup lang="ts">
import type { ChannelScheduleItem, ChannelTimeline, PlaybackState } from '~/types/database'

const props = defineProps<{
  schedule: ChannelScheduleItem[]
  timeline: ChannelTimeline | null
  playbackState: PlaybackState | null
}>()

const emit = defineEmits<{
  close: []
}>()

interface ScheduleEntry {
  video: ChannelScheduleItem
  startTime: Date
  isLoopStart: boolean
  isCurrent: boolean
  isPast: boolean
}

/**
 * Total schedule duration in seconds
 */
const totalDurationSeconds = computed(() => {
  return props.schedule.reduce((sum, v) => sum + v.duration_seconds, 0)
})

/**
 * Format total duration as "Xh Ym"
 */
const totalDurationFormatted = computed(() => {
  const total = totalDurationSeconds.value
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0) {
    return `${h}h ${m}m`
  }
  return `${m}m`
})

/**
 * Generate 12-hour TV guide schedule with loop indicators
 */
const scheduleEntries = computed<ScheduleEntry[]>(() => {
  if (!props.timeline || !props.schedule.length) return []

  const entries: ScheduleEntry[] = []
  const now = Date.now()
  const windowEnd = now + 12 * 60 * 60 * 1000 // 12 hours from now
  const startTime = new Date(props.timeline.start_time)
  const totalDuration = totalDurationSeconds.value * 1000 // in ms

  if (totalDuration === 0) return []

  // Calculate current loop start
  const elapsedSinceStart = now - startTime.getTime()
  const loopsCompleted = Math.floor(elapsedSinceStart / totalDuration)
  let currentLoopStartTime = startTime.getTime() + loopsCompleted * totalDuration

  // If we're before the current loop visually, go back one
  let cumulativeMs = 0
  for (const video of props.schedule) {
    const videoStartMs = currentLoopStartTime + cumulativeMs
    if (videoStartMs > now) break
    cumulativeMs += video.duration_seconds * 1000
  }

  // Generate entries for the 12-hour window
  let currentTime = currentLoopStartTime
  let loopCount = 0
  const maxLoops = 20 // Safety limit

  while (currentTime < windowEnd && loopCount < maxLoops) {
    for (let i = 0; i < props.schedule.length; i++) {
      const video = props.schedule[i]!
      const videoEndTime = currentTime + video.duration_seconds * 1000

      // Skip videos that ended before now
      if (videoEndTime < now) {
        currentTime = videoEndTime
        continue
      }

      // Stop if we're past the 12-hour window
      if (currentTime > windowEnd) break

      const isCurrent = props.playbackState?.currentVideoIndex === i && loopCount === 0
      const isPast = videoEndTime < now

      entries.push({
        video,
        startTime: new Date(currentTime),
        isLoopStart: i === 0 && loopCount > 0,
        isCurrent,
        isPast,
      })

      currentTime = videoEndTime
    }

    loopCount++
  }

  return entries
})

// Keep the old computed for backwards compatibility (used by template)
const videoStartTimes = computed(() => {
  if (!props.timeline || !props.schedule.length) return []

  const startTime = new Date(props.timeline.start_time)
  const totalScheduleDuration = props.schedule.reduce((sum, v) => sum + v.duration_seconds, 0)

  // Calculate current position in the loop
  const now = Date.now()
  const elapsedSinceStart = (now - startTime.getTime()) / 1000

  // Handle looping: find where we are in the current loop
  const loopsCompleted = Math.floor(elapsedSinceStart / totalScheduleDuration)
  const currentLoopStartTime = new Date(startTime.getTime() + loopsCompleted * totalScheduleDuration * 1000)

  // Calculate start time for each video
  const startTimes: Date[] = []
  let cumulativeSeconds = 0

  for (const video of props.schedule) {
    startTimes.push(new Date(currentLoopStartTime.getTime() + cumulativeSeconds * 1000))
    cumulativeSeconds += video.duration_seconds
  }

  return startTimes
})

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click="handleBackdropClick">
      <div class="modal">
        <header class="modal-header">
          <div class="header-info">
            <h2>Schedule</h2>
            <span class="total-duration">Total: {{ totalDurationFormatted }}</span>
          </div>
          <button class="close-button" @click="emit('close')">&times;</button>
        </header>

        <div class="modal-body">
          <ul class="schedule-list">
            <template v-for="(entry, index) in scheduleEntries" :key="`${entry.video.id}-${index}`">
              <!-- Loop separator -->
              <li v-if="entry.isLoopStart" class="loop-separator">
                <span class="loop-line"></span>
                <span class="loop-label">Schedule loops</span>
                <span class="loop-line"></span>
              </li>

              <li
                class="schedule-item"
                :class="{
                  current: entry.isCurrent,
                  past: entry.isPast
                }"
              >
                <div class="time-slot">
                  <span class="start-time">
                    {{ formatTime(entry.startTime) }}
                  </span>
                  <span v-if="entry.isCurrent" class="now-indicator">
                    NOW
                  </span>
                </div>

                <div class="thumbnail">
                  <img
                    :src="entry.video.thumbnail_url || getYouTubeThumbnail(entry.video.youtube_video_id)"
                    :alt="entry.video.title || 'Video thumbnail'"
                    loading="lazy"
                  />
                </div>

                <div class="info">
                  <span class="title">{{ entry.video.title || entry.video.youtube_video_id }}</span>
                  <span v-if="entry.video.youtube_channel_name" class="channel">
                    {{ entry.video.youtube_channel_name }}
                  </span>
                </div>

                <span class="duration">{{ formatDuration(entry.video.duration_seconds) }}</span>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(7, 6, 5, 0.86);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  background: linear-gradient(180deg, rgba(21, 19, 16, 0.95), rgba(11, 10, 8, 0.98));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-soft);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(244, 239, 230, 0.04), transparent);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modal-header h2 {
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-tertiary);
}

.total-duration {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.close-button {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-muted);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.close-button:hover {
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-text-primary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
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

.schedule-item.current {
  background: rgba(215, 161, 103, 0.18);
}

.schedule-item.past {
  opacity: 0.5;
}

.loop-separator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.loop-line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.loop-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.schedule-item:last-child {
  border-bottom: none;
}

.time-slot {
  width: 70px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.start-time {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-family: var(--font-mono);
}

.schedule-item.current .start-time {
  color: var(--color-accent);
}

.now-indicator {
  padding: 2px 6px;
  background: var(--color-accent);
  border-radius: 3px;
  color: var(--color-bg-primary);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.thumbnail {
  width: 80px;
  flex-shrink: 0;
}

.thumbnail img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 4px;
  background: var(--color-bg-elevated);
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  font-size: 13px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-item.current .title {
  color: var(--color-text-primary);
}

.channel {
  font-size: 11px;
  color: var(--color-text-muted);
}

.duration {
  color: var(--color-text-muted);
  font-size: 12px;
  font-family: var(--font-mono);
  flex-shrink: 0;
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .time-slot {
    width: 55px;
  }

  .start-time {
    font-size: 11px;
  }

  .thumbnail {
    width: 60px;
  }
}
</style>
