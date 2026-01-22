<script setup lang="ts">
import type { Channel } from '~/types/database'

defineProps<{
  channels: Channel[]
  currentSlug: string | null
}>()

defineEmits<{
  (e: 'select', slug: string): void
}>()
</script>

<template>
  <div class="channel-list">
    <div class="header">
      <span class="title">Channels</span>
      <span class="hint">Press 1-9 to switch</span>
    </div>

    <ul class="channels">
      <li
        v-for="(channel, index) in channels"
        :key="channel.id"
        class="channel-item"
        :class="{ active: channel.slug === currentSlug }"
        @click="$emit('select', channel.slug)"
      >
        <span class="index">{{ index + 1 }}</span>
        <span class="name">{{ channel.title }}</span>
        <span v-if="channel.slug === currentSlug" class="live-badge">LIVE</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.channel-list {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.9);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
  font-size: 13px;
  width: 280px;
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.title {
  color: #fff;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 1px;
}

.hint {
  color: #555;
  font-size: 10px;
}

.channels {
  list-style: none;
  margin: 0;
  padding: 8px 0;
  overflow-y: auto;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.channel-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.channel-item.active {
  background: rgba(255, 255, 255, 0.1);
}

.index {
  color: #555;
  font-size: 11px;
  min-width: 16px;
}

.name {
  color: #ccc;
  flex: 1;
}

.channel-item.active .name {
  color: #fff;
}

.live-badge {
  color: #f44;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1px;
}
</style>
