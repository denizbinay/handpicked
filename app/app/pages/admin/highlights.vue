<script setup lang="ts">
import type { ChannelWithCreator } from '~/composables/useAdmin'

definePageMeta({
  middleware: 'admin-auth',
})

const { getHighlightChannels, getNonHighlightChannels, toggleHighlight } = useAdmin()

const highlightChannels = ref<ChannelWithCreator[]>([])
const availableChannels = ref<ChannelWithCreator[]>([])
const loading = ref(true)
const selectedChannelId = ref<string>('')

async function loadChannels() {
  loading.value = true
  const [highlights, available] = await Promise.all([
    getHighlightChannels(),
    getNonHighlightChannels(),
  ])
  highlightChannels.value = highlights
  availableChannels.value = available
  loading.value = false
}

onMounted(loadChannels)

async function addHighlight() {
  if (!selectedChannelId.value) return

  const channel = availableChannels.value.find(c => c.id === selectedChannelId.value)
  if (!channel) return

  const success = await toggleHighlight(channel.id, true)
  if (success) {
    // Move channel from available to highlights
    availableChannels.value = availableChannels.value.filter(c => c.id !== channel.id)
    channel.is_highlight = true
    highlightChannels.value.push(channel)
    selectedChannelId.value = ''
  }
}

async function removeHighlight(channel: ChannelWithCreator) {
  const success = await toggleHighlight(channel.id, false)
  if (success) {
    // Move channel from highlights to available (if public)
    highlightChannels.value = highlightChannels.value.filter(c => c.id !== channel.id)
    channel.is_highlight = false
    if (channel.is_public) {
      availableChannels.value.push(channel)
      availableChannels.value.sort((a, b) => a.title.localeCompare(b.title))
    }
  }
}
</script>

<template>
  <div class="admin-page">
    <header class="header">
      <div class="header-left">
        <NuxtLink to="/admin" class="back-link">← Back</NuxtLink>
        <h1>Highlight Channels</h1>
      </div>
    </header>

    <main class="main">
      <p class="description">
        Highlight channels appear in the sidebar. The list adapts to available space.
      </p>

      <!-- Current Highlights -->
      <section class="highlights-section">
        <div class="section-header">
          <h2>Current Highlights</h2>
          <span class="count">{{ highlightChannels.length }} channels</span>
        </div>

        <div v-if="loading" class="loading">Loading...</div>
        <div v-else-if="highlightChannels.length === 0" class="empty">
          No highlight channels set
        </div>
        <ul v-else class="highlights-list">
          <li
            v-for="(channel, index) in highlightChannels"
            :key="channel.id"
            class="highlight-item"
            :class="{ featured: index < 6 }"
          >
            <span class="position">{{ index + 1 }}</span>
            <div class="channel-info">
              <span class="channel-title">{{ channel.title }}</span>
              <span class="channel-curator">
                @{{ channel.creator_profiles?.username || 'unknown' }}
              </span>
            </div>
            <button
              class="remove-button"
              title="Remove from highlights"
              @click="removeHighlight(channel)"
            >
              Remove
            </button>
          </li>
        </ul>
      </section>

      <!-- Add Highlight -->
      <section class="add-section">
        <div class="section-header">
          <h2>Add Highlight</h2>
        </div>
        <div class="add-form">
          <select v-model="selectedChannelId" class="channel-select">
            <option value="">Select a channel...</option>
            <option
              v-for="channel in availableChannels"
              :key="channel.id"
              :value="channel.id"
            >
              {{ channel.title }} (@{{ channel.creator_profiles?.username || 'unknown' }})
            </option>
          </select>
          <button
            class="add-button"
            :disabled="!selectedChannelId"
            @click="addHighlight"
          >
            Add
          </button>
        </div>
        <p v-if="availableChannels.length === 0 && !loading" class="no-available">
          All public channels are already highlights
        </p>
      </section>
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
  max-width: 700px;
  margin: 0 auto;
  padding: 24px;
}

.description {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
}

.highlights-section,
.add-section {
  background: rgba(15, 14, 12, 0.85);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.section-header h2 {
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
}

.count {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.loading,
.empty {
  padding: 32px 20px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
}

.highlights-list {
  list-style: none;
}

.highlight-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
  gap: 12px;
}

.highlight-item:last-child {
  border-bottom: none;
}

.position {
  width: 24px;
  text-align: center;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}

.channel-info {
  flex: 1;
  min-width: 0;
}

.channel-title {
  display: block;
  font-weight: 500;
  font-family: var(--font-display);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-curator {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}


.remove-button {
  padding: 6px 12px;
  font-size: 11px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}

.remove-button:hover {
  border-color: rgba(239, 138, 122, 0.8);
  color: #ef8a7a;
}

.add-form {
  display: flex;
  gap: 12px;
  padding: 20px;
}

.channel-select {
  flex: 1;
  padding: 10px 12px;
  background: rgba(11, 10, 8, 0.9);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.channel-select:focus {
  border-color: rgba(215, 161, 103, 0.6);
  outline: none;
}

.add-button {
  padding: 10px 24px;
  background: linear-gradient(120deg, rgba(215, 161, 103, 0.95), rgba(111, 196, 184, 0.85));
  border: 1px solid rgba(215, 161, 103, 0.4);
  border-radius: 999px;
  color: #120f0a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: var(--shadow-glow);
}

.add-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-available {
  padding: 0 20px 20px;
  font-size: 13px;
  color: var(--color-text-muted);
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

  .highlight-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .add-form {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .main {
    padding: 24px 16px;
  }
}
</style>
