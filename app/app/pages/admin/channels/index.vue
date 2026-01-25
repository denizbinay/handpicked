<script setup lang="ts">
import type { ChannelWithCreator } from '~/composables/useAdmin'

definePageMeta({
  middleware: 'admin-auth',
})

const { getAllChannels, toggleChannelVisibility, toggleHighlight } = useAdmin()

const channels = ref<ChannelWithCreator[]>([])
const loading = ref(true)
const filter = ref<'all' | 'public' | 'private' | 'highlights'>('all')
const search = ref('')

async function loadChannels() {
  loading.value = true
  channels.value = await getAllChannels()
  loading.value = false
}

onMounted(loadChannels)

const filteredChannels = computed(() => {
  let result = channels.value

  // Apply filter
  if (filter.value === 'public') {
    result = result.filter(c => c.is_public)
  } else if (filter.value === 'private') {
    result = result.filter(c => !c.is_public)
  } else if (filter.value === 'highlights') {
    result = result.filter(c => c.is_highlight)
  }

  // Apply search
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    result = result.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.creator_profiles?.username?.toLowerCase().includes(q)
    )
  }

  return result
})

async function handleToggleVisibility(channel: ChannelWithCreator) {
  const success = await toggleChannelVisibility(channel.id, !channel.is_public)
  if (success) {
    channel.is_public = !channel.is_public
  }
}

async function handleToggleHighlight(channel: ChannelWithCreator) {
  const success = await toggleHighlight(channel.id, !channel.is_highlight)
  if (success) {
    channel.is_highlight = !channel.is_highlight
  }
}
</script>

<template>
  <div class="admin-page">
    <header class="header">
      <div class="header-left">
        <NuxtLink to="/admin" class="back-link">← Back</NuxtLink>
        <h1>All Channels</h1>
      </div>
    </header>

    <main class="main">
      <!-- Filters -->
      <div class="filters">
        <div class="filter-tabs">
          <button
            class="filter-tab"
            :class="{ active: filter === 'all' }"
            @click="filter = 'all'"
          >
            All
          </button>
          <button
            class="filter-tab"
            :class="{ active: filter === 'public' }"
            @click="filter = 'public'"
          >
            Public
          </button>
          <button
            class="filter-tab"
            :class="{ active: filter === 'private' }"
            @click="filter = 'private'"
          >
            Private
          </button>
          <button
            class="filter-tab"
            :class="{ active: filter === 'highlights' }"
            @click="filter = 'highlights'"
          >
            Highlights
          </button>
        </div>
        <input
          v-model="search"
          type="text"
          placeholder="Search..."
          class="search-input"
        />
      </div>

      <!-- Channel List -->
      <div class="channels-section">
        <div v-if="loading" class="loading">Loading channels...</div>
        <div v-else-if="filteredChannels.length === 0" class="empty">
          No channels found
        </div>
        <ul v-else class="channels-list">
          <li
            v-for="channel in filteredChannels"
            :key="channel.id"
            class="channel-item"
          >
            <div class="channel-info">
              <span class="channel-title">{{ channel.title }}</span>
              <span class="channel-curator">
                @{{ channel.creator_profiles?.username || 'unknown' }}
              </span>
              <span v-if="channel.category" class="channel-category">
                {{ channel.category }}
              </span>
            </div>
            <div class="channel-status">
              <button
                class="toggle-btn"
                :class="{ active: channel.is_public }"
                @click="handleToggleVisibility(channel)"
                :title="channel.is_public ? 'Make private' : 'Make public'"
              >
                {{ channel.is_public ? 'Public' : 'Private' }}
              </button>
              <button
                class="toggle-btn highlight"
                :class="{ active: channel.is_highlight }"
                @click="handleToggleHighlight(channel)"
                :title="channel.is_highlight ? 'Remove highlight' : 'Make highlight'"
              >
                {{ channel.is_highlight ? '★' : '☆' }}
              </button>
            </div>
            <div class="channel-actions">
              <NuxtLink
                :to="`/admin/channels/${channel.id}`"
                class="action-button"
              >
                Edit
              </NuxtLink>
              <NuxtLink
                :to="`/${channel.slug}`"
                class="action-button"
                target="_blank"
              >
                View
              </NuxtLink>
            </div>
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: transparent;
  color: var(--color-text-primary);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(244, 239, 230, 0.03), transparent);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-link {
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-text-primary);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  font-family: var(--font-display);
}

.main {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.filter-tabs {
  display: flex;
  gap: 4px;
}

.filter-tab {
  padding: 8px 16px;
  font-size: 13px;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}

.filter-tab:first-child {
  border-radius: 999px 0 0 999px;
}

.filter-tab:last-child {
  border-radius: 0 999px 999px 0;
}

.filter-tab:not(:first-child) {
  border-left: none;
}

.filter-tab:hover {
  color: var(--color-text-secondary);
}

.filter-tab.active {
  background: rgba(215, 161, 103, 0.15);
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-text-primary);
}

.search-input {
  padding: 8px 16px;
  background: rgba(11, 10, 8, 0.9);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-primary);
  font-size: 13px;
  width: 200px;
}

.search-input:focus {
  border-color: rgba(215, 161, 103, 0.6);
  outline: none;
}

.channels-section {
  background: rgba(15, 14, 12, 0.85);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.loading,
.empty {
  padding: 48px 20px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
}

.channels-list {
  list-style: none;
}

.channel-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
  gap: 16px;
}

.channel-item:last-child {
  border-bottom: none;
}

.channel-info {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.channel-title {
  font-weight: 500;
  font-family: var(--font-display);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-curator {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.channel-category {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(244, 239, 230, 0.08);
  color: var(--color-text-tertiary);
  text-transform: capitalize;
}

.channel-status {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  padding: 4px 10px;
  font-size: 11px;
  background: rgba(244, 239, 230, 0.05);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn:hover {
  border-color: rgba(215, 161, 103, 0.6);
}

.toggle-btn.active {
  background: rgba(0, 200, 100, 0.1);
  border-color: rgba(0, 200, 100, 0.4);
  color: #7fd1a1;
}

.toggle-btn.highlight {
  padding: 4px 8px;
}

.toggle-btn.highlight.active {
  background: rgba(215, 161, 103, 0.15);
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-accent);
}

.channel-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 6px 12px;
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  text-decoration: none;
}

.action-button:hover {
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-text-primary);
}

@media (max-width: 900px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-left {
    flex-wrap: wrap;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-tabs {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .channel-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .channel-status,
  .channel-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .main {
    padding: 24px 16px;
  }

  .filter-tab {
    padding: 10px 12px;
    font-size: 12px;
  }
}
</style>
