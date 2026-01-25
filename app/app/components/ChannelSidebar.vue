<script setup lang="ts">
import type { Channel, ChannelCategory } from '~/types/database'

const props = defineProps<{
  channels: Channel[]
  currentSlug: string | null
}>()

const { authState, refreshSession } = useAuth()
const isAuthenticated = computed(() => authState.value === 'authenticated')

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

const channelList = computed<Channel[]>(() => {
  return Array.isArray(props.channels) ? props.channels : []
})

const curatorHref = computed(() => (isAuthenticated.value ? '/curator' : '/curator/login'))
const curatorLabel = computed(() => (isAuthenticated.value ? 'Your Dashboard' : 'Become a Curator'))

// Highlight channels: channels with is_highlight flag, sorted by highlight_order
const highlightChannels = computed(() => {
  return channelList.value
    .filter(c => c.is_highlight)
    .sort((a, b) => (a.highlight_order ?? 999) - (b.highlight_order ?? 999))
})

// Get ALL channels for a category (excluding highlights)
function getCategoryChannels(category: ChannelCategory): Channel[] {
  const highlightIds = new Set(highlightChannels.value.map(c => c.id))
  return channelList.value.filter(c => c.category === category && !highlightIds.has(c.id))
}

// Available categories (only categories with channels beyond highlights)
const availableCategories = computed(() => {
  const highlightIds = new Set(highlightChannels.value.map(c => c.id))
  return categories.filter(cat =>
    channelList.value.some(c => c.category === cat.value && !highlightIds.has(c.id))
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

onMounted(async () => {
  await refreshSession()
})
</script>

<template>
  <div class="channel-sidebar">
    <!-- Header -->
    <div class="header">
      <span class="title">CHANNELS</span>
      <NuxtLink :to="curatorHref" class="curator-link">
        {{ curatorLabel }}
      </NuxtLink>
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
  background: rgba(12, 11, 9, 0.86);
  border-left: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
  font-family: var(--font-mono);
  font-size: 13px;
  width: 240px;
  height: 100%;
  overflow: hidden;
  box-shadow: inset 1px 0 0 rgba(244, 239, 230, 0.04);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(244, 239, 230, 0.04), transparent);
  flex-shrink: 0;
}

.title {
  color: var(--color-text-primary);
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 1px;
}

.curator-link {
  color: var(--color-text-tertiary);
  font-size: 11px;
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(244, 239, 230, 0.12);
  background: rgba(15, 14, 12, 0.6);
  transition: all 0.15s;
}

.curator-link:hover {
  color: var(--color-text-primary);
  border-color: rgba(215, 161, 103, 0.6);
  background: rgba(215, 161, 103, 0.12);
  box-shadow: var(--shadow-glow);
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
  overflow: hidden;
  max-height: 45vh;
  position: relative;
}

.highlights-section::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 24px;
  background: linear-gradient(180deg, rgba(12, 11, 9, 0), rgba(12, 11, 9, 0.85));
  pointer-events: none;
}

@media (max-height: 760px) {
  .highlights-section {
    max-height: 35vh;
  }

  .highlights-section::after {
    height: 20px;
  }
}

.section-header {
  padding: 0 16px 8px;
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--color-text-muted);
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
  border-left: 2px solid transparent;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.channel-item:hover {
  background: rgba(244, 239, 230, 0.06);
}

.channel-item.active {
  background: rgba(215, 161, 103, 0.12);
  border-left-color: var(--color-accent);
  box-shadow: inset 0 0 0 1px rgba(215, 161, 103, 0.08);
}

.name {
  color: var(--color-text-secondary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-item.active .name {
  color: var(--color-text-primary);
}

.live-badge {
  color: #e3775b;
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
  border-top: 1px solid var(--color-border-subtle);
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
  border-bottom: 1px solid var(--color-border-subtle);
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
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.accordion-header:hover {
  background: rgba(244, 239, 230, 0.04);
  color: var(--color-text-secondary);
}

.accordion.expanded .accordion-header {
  color: var(--color-text-primary);
}

.accordion-icon {
  font-size: 8px;
  width: 12px;
  color: var(--color-text-muted);
}

.accordion.expanded .accordion-icon {
  color: var(--color-accent);
}

.accordion-label {
  flex: 1;
}

.accordion-count {
  font-size: 10px;
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
  font-size: 11px;
  text-decoration: none;
  transition: color 0.15s;
}

.see-all:hover {
  color: var(--color-accent);
}

/* Explore button */
.explore-section {
  padding: 12px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.explore-button {
  display: block;
  width: 100%;
  padding: 10px;
  background: rgba(21, 19, 16, 0.9);
  border: 1px solid rgba(244, 239, 230, 0.12);
  border-radius: 10px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-family: inherit;
  text-align: center;
  text-decoration: none;
  transition: all 0.15s;
}

.explore-button:hover {
  background: rgba(215, 161, 103, 0.14);
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-glow);
}

@media (max-width: 900px) {
  .channel-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: min(85vw, 320px);
    z-index: 30;
    border-left: 1px solid var(--color-border);
    box-shadow: -12px 0 30px rgba(0, 0, 0, 0.35);
  }

  .highlights-section {
    max-height: 40vh;
  }
}
</style>
