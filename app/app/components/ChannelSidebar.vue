<script setup lang="ts">
import type { Channel, ChannelCategory } from '~/types/database'

const props = defineProps<{
  channels: Channel[]
  currentSlug: string | null
}>()

const emit = defineEmits<{
  select: [slug: string]
}>()

// Category configuration
const categories: { value: ChannelCategory; label: string }[] = [
  { value: 'tech', label: 'Tech' },
  { value: 'music', label: 'Music' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'art', label: 'Art' },
  { value: 'science', label: 'Science' },
  { value: 'news', label: 'News' },
]

// Track which accordion is expanded (only one at a time)
const expandedCategory = ref<ChannelCategory | null>(null)

// Highlight channels: top 6 channels
const highlightChannels = computed(() => {
  return props.channels.slice(0, 6)
})

// Get ALL channels for a category (excluding highlights)
function getCategoryChannels(category: ChannelCategory): Channel[] {
  const highlightIds = new Set(highlightChannels.value.map(c => c.id))
  return props.channels.filter(c => c.category === category && !highlightIds.has(c.id))
}

// Available categories (only categories with channels beyond highlights)
const availableCategories = computed(() => {
  const highlightIds = new Set(highlightChannels.value.map(c => c.id))
  return categories.filter(cat =>
    props.channels.some(c => c.category === cat.value && !highlightIds.has(c.id))
  )
})

// Toggle accordion
function toggleCategory(category: ChannelCategory) {
  expandedCategory.value = expandedCategory.value === category ? null : category
}

// Check if channel is current
function isActive(channel: Channel): boolean {
  return channel.slug === props.currentSlug
}
</script>

<template>
  <div class="channel-sidebar">
    <!-- Header -->
    <div class="header">
      <span class="title">CHANNELS</span>
    </div>

    <!-- Main content area -->
    <div class="sidebar-content">
      <!-- Highlights Section (top) -->
      <div class="highlights-section">
        <div class="section-header">HIGHLIGHTS</div>
        <ul class="channel-list">
          <li
            v-for="channel in highlightChannels"
            :key="channel.id"
            class="channel-item"
            :class="{ active: isActive(channel) }"
            @click="emit('select', channel.slug)"
          >
            <span class="name">{{ channel.title }}</span>
            <span v-if="isActive(channel)" class="live-badge">LIVE</span>
          </li>
        </ul>
      </div>

      <!-- Spacer pushes accordions to bottom -->
      <div class="spacer"></div>

      <!-- Category Accordions (pinned to bottom) -->
      <div class="accordions-section">
        <div
          v-for="cat in availableCategories"
          :key="cat.value"
          class="accordion"
          :class="{ expanded: expandedCategory === cat.value }"
        >
          <button
            class="accordion-header"
            @click="toggleCategory(cat.value)"
          >
            <span class="accordion-icon">{{ expandedCategory === cat.value ? '▼' : '▶' }}</span>
            <span class="accordion-label">{{ cat.label }}</span>
            <span class="accordion-count">{{ getCategoryChannels(cat.value).length }}</span>
          </button>

          <div v-if="expandedCategory === cat.value" class="accordion-content">
            <ul class="channel-list">
              <li
                v-for="channel in getCategoryChannels(cat.value)"
                :key="channel.id"
                class="channel-item"
                :class="{ active: isActive(channel) }"
                @click="emit('select', channel.slug)"
              >
                <span class="name">{{ channel.title }}</span>
                <span v-if="isActive(channel)" class="live-badge">LIVE</span>
              </li>
            </ul>
            <NuxtLink :to="`/explore?category=${cat.value}`" class="see-all">
              See all {{ cat.label }} →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Explore Button (pinned at bottom) -->
    <div class="explore-section">
      <NuxtLink to="/explore" class="explore-button">
        Explore all channels
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.channel-sidebar {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.9);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
  font-size: 13px;
  width: 240px;
  height: 100%;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.title {
  color: #fff;
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 1px;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.highlights-section {
  padding: 12px 0;
  flex-shrink: 0;
}

.section-header {
  padding: 0 16px 8px;
  font-size: 10px;
  letter-spacing: 1px;
  color: #666;
  font-weight: 500;
}

.channel-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.channel-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.channel-item.active {
  background: rgba(255, 255, 255, 0.1);
}

.name {
  color: #ccc;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* Spacer pushes accordions to bottom */
.spacer {
  flex: 1;
  min-height: 20px;
}

/* Accordions section */
.accordions-section {
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  max-height: 50%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.accordions-section::-webkit-scrollbar {
  width: 4px;
}

.accordions-section::-webkit-scrollbar-track {
  background: transparent;
}

.accordions-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.accordion {
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.accordion:last-child {
  border-bottom: none;
}

.accordion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  color: #888;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.accordion-header:hover {
  background: rgba(255, 255, 255, 0.03);
  color: #ccc;
}

.accordion.expanded .accordion-header {
  color: #fff;
}

.accordion-icon {
  font-size: 8px;
  width: 12px;
  color: #555;
}

.accordion.expanded .accordion-icon {
  color: #4af;
}

.accordion-label {
  flex: 1;
}

.accordion-count {
  font-size: 10px;
  color: #555;
}

.accordion-content {
  padding-bottom: 8px;
}

.accordion-content .channel-item {
  padding-left: 20px;
}

.see-all {
  display: block;
  padding: 6px 20px;
  color: #555;
  font-size: 11px;
  text-decoration: none;
  transition: color 0.15s;
}

.see-all:hover {
  color: #4af;
}

/* Explore button */
.explore-section {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.explore-button {
  display: block;
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #aaa;
  font-size: 11px;
  font-family: inherit;
  text-align: center;
  text-decoration: none;
  transition: all 0.15s;
}

.explore-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}
</style>
