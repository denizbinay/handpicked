<script setup lang="ts">
import type { PlaybackState } from '~/types/database'

defineProps<{
  channelTitle: string
  state: PlaybackState | null
}>()

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="now-playing">
    <div class="channel-info">
      <span class="label">Channel</span>
      <span class="channel-title">{{ channelTitle }}</span>
    </div>

    <div v-if="state" class="video-info">
      <span class="label">Now Playing</span>
      <span class="video-title">{{ state.currentVideo.title || state.currentVideo.youtube_video_id }}</span>
      <span class="video-position">
        {{ formatTime(state.offsetSeconds) }} / {{ formatTime(state.currentVideo.duration_seconds) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.now-playing {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
  font-size: 13px;
  color: #fff;
}

.channel-info,
.video-info {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.label {
  color: #666;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.5px;
  min-width: 80px;
}

.channel-title {
  color: #fff;
  font-weight: 500;
}

.video-title {
  color: #aaa;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-position {
  color: #666;
  font-variant-numeric: tabular-nums;
}
</style>
