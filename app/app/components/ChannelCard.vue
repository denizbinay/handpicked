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
  <NuxtLink :to="`/${channel.slug}`" class="channel-card">
    <div class="card-header">
      <h3 class="channel-title">{{ channel.title }}</h3>
      <span v-if="showCategory && channel.category" class="category-badge">
        {{ categoryLabels[channel.category] }}
      </span>
    </div>

    <p v-if="channel.description" class="channel-description">
      {{ channel.description }}
    </p>

    <div v-if="creator" class="curator-info">
      <NuxtLink
        :to="`/@${creator.username}`"
        class="curator-link"
        @click.stop
      >
        @{{ creator.username }}
      </NuxtLink>
    </div>
  </NuxtLink>
</template>

<style scoped>
.channel-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.15s;
  min-height: 100px;
}

.channel-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.channel-title {
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  margin: 0;
  line-height: 1.3;
}

.category-badge {
  flex-shrink: 0;
  padding: 3px 8px;
  background: rgba(68, 170, 255, 0.1);
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

.curator-info {
  margin-top: auto;
  padding-top: 8px;
}

.curator-link {
  font-size: 12px;
  color: #666;
  text-decoration: none;
  font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
  transition: color 0.15s;
}

.curator-link:hover {
  color: #4af;
}
</style>
