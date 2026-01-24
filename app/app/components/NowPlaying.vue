<script setup lang="ts">
import type { PlaybackState, ChannelScheduleItem } from '~/types/database'

defineProps<{
  channelTitle: string
  state: PlaybackState | null
  nextVideo: ChannelScheduleItem | null
}>()

const emit = defineEmits<{
  showSchedule: []
}>()

function getYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}
</script>

<template>
  <div class="now-playing">
    <!-- Now Playing -->
    <div v-if="state" class="section now-section">
      <span class="label">NOW</span>
      <span class="video-title">{{ state.currentVideo.title || state.currentVideo.youtube_video_id }}</span>
      <a
        :href="getYouTubeUrl(state.currentVideo.youtube_video_id)"
        target="_blank"
        rel="noopener"
        class="youtube-link"
        title="Watch on YouTube"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>

    <!-- Next Video -->
    <template v-if="nextVideo">
      <div class="divider"></div>
      <div class="section next-section">
        <span class="arrow">→</span>
        <span class="label">NEXT</span>
        <span class="next-title">{{ nextVideo.title || nextVideo.youtube_video_id }}</span>
      </div>
    </template>

    <div class="spacer"></div>

    <!-- Schedule Button -->
    <button class="schedule-button" @click="emit('showSchedule')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
      <span>Schedule</span>
    </button>
  </div>
</template>

<style scoped>
.now-playing {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0.95) 100%);
  border-top: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-primary);
  position: relative;
}

.now-playing::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-accent-glow), transparent);
}

.section {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  flex-shrink: 0;
}

.label {
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 1.5px;
  flex-shrink: 0;
}

.now-section {
  flex: 1;
  min-width: 0;
}

.video-title {
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.youtube-link {
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.youtube-link:hover {
  color: var(--color-accent);
  background: var(--color-accent-glow);
}

.next-section {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 640px;
}

.arrow {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.next-title {
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.spacer {
  flex: 0 0 auto;
  width: var(--space-lg);
}

.schedule-button {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.schedule-button:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  box-shadow: var(--shadow-glow);
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .now-playing {
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .next-section {
    display: none;
  }

  .divider {
    display: none;
  }

  .spacer {
    flex: 1;
  }
}
</style>
