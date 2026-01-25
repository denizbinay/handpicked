<script setup lang="ts">
import type { Channel, CreatorProfile, ChannelCategory } from '~/types/database'

defineProps<{
  channel: Channel
  creator: CreatorProfile | null
  showCategory?: boolean
}>()

const categoryLabels: Record<ChannelCategory, string> = {
  tech: 'Tech',
  music: 'Music',
  documentary: 'Documentary',
  comedy: 'Comedy',
  gaming: 'Gaming',
  art: 'Art',
  science: 'Science',
  news: 'News',
}
</script>

<template>
  <NuxtLink :to="`/${channel.slug}`" class="channel-row">
    <div class="row-main">
      <div class="row-header">
        <h3 class="channel-title">{{ channel.title }}</h3>
        <span v-if="showCategory && channel.category" class="category-badge">
          {{ categoryLabels[channel.category] }}
        </span>
      </div>

      <p v-if="channel.description" class="channel-description">
        {{ channel.description }}
      </p>
    </div>

    <div class="row-meta">
      <NuxtLink
        v-if="creator"
        :to="`/@${creator.username}`"
        class="curator-link"
        @click.stop
      >
        @{{ creator.username }}
      </NuxtLink>
      <span v-else class="curator-placeholder">Independent</span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.channel-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 16px 20px;
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 0.15s, border-color 0.15s;
}

.channel-row:hover {
  background: rgba(255, 255, 255, 0.03);
  border-bottom-color: rgba(255, 255, 255, 0.12);
}

.row-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.row-header {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.channel-title {
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-badge {
  flex-shrink: 0;
  padding: 3px 8px;
  background: rgba(68, 170, 255, 0.08);
  border: 1px solid rgba(68, 170, 255, 0.2);
  border-radius: 4px;
  font-size: 10px;
  color: #4af;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.channel-description {
  font-size: 13px;
  color: #888;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 12px;
  font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
  white-space: nowrap;
}

.curator-link {
  color: #666;
  text-decoration: none;
  transition: color 0.15s;
}

.curator-link:hover {
  color: #4af;
}

.curator-placeholder {
  color: #444;
}
</style>
