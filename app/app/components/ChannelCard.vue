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
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.channel-row:hover {
  background: rgba(244, 239, 230, 0.04);
  border-bottom-color: rgba(215, 161, 103, 0.2);
  box-shadow: inset 2px 0 0 rgba(215, 161, 103, 0.4);
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
  color: var(--color-text-primary);
  font-family: var(--font-display);
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-badge {
  flex-shrink: 0;
  padding: 3px 8px;
  background: rgba(215, 161, 103, 0.12);
  border: 1px solid rgba(215, 161, 103, 0.3);
  border-radius: 999px;
  font-size: 10px;
  color: var(--color-accent);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.channel-description {
  font-size: 13px;
  color: var(--color-text-tertiary);
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
  color: var(--color-text-muted);
  font-size: 12px;
  font-family: var(--font-mono);
  white-space: nowrap;
}

.curator-link {
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.curator-link:hover {
  color: var(--color-accent);
}

.curator-placeholder {
  color: #4f4a41;
}

@media (max-width: 640px) {
  .channel-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .row-meta {
    justify-content: flex-start;
  }
}
</style>
