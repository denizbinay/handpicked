<script setup lang="ts">
import type { Channel, CreatorProfile, ChannelCategory } from '~/types/database'

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

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

// Get category from query params
const selectedCategory = computed({
  get: () => (route.query.category as ChannelCategory | undefined) ?? null,
  set: (value: ChannelCategory | null) => {
    if (value) {
      router.replace({ query: { category: value } })
    } else {
      router.replace({ query: {} })
    }
  },
})

// Fetch all public channels with creator profiles
interface ChannelWithCreator extends Channel {
  creator: CreatorProfile | null
}

const { data: channels } = await useAsyncData('explore-channels', async () => {
  // First fetch channels
  const { data: channelsData, error: channelsError } = await supabase
    .from('channels')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (channelsError) throw channelsError

  // Then fetch creator profiles for these channels
  const creatorIds = [...new Set(channelsData.map(c => c.created_by))]
  const { data: creatorsData } = await supabase
    .from('creator_profiles')
    .select('*')
    .in('id', creatorIds)

  const creatorsMap = new Map(creatorsData?.map(c => [c.id, c]) ?? [])

  // Combine channels with creators
  return channelsData.map(channel => ({
    ...channel,
    creator: creatorsMap.get(channel.created_by) ?? null
  })) as ChannelWithCreator[]
})

// Group channels by category
const channelsByCategory = computed(() => {
  if (!channels.value) return new Map<ChannelCategory, ChannelWithCreator[]>()

  const grouped = new Map<ChannelCategory, ChannelWithCreator[]>()

  for (const channel of channels.value) {
    if (channel.category) {
      const existing = grouped.get(channel.category) ?? []
      existing.push(channel)
      grouped.set(channel.category, existing)
    }
  }

  return grouped
})

// Filtered channels (when category selected)
const filteredChannels = computed(() => {
  if (!selectedCategory.value || !channels.value) return []
  return channels.value.filter(c => c.category === selectedCategory.value)
})

// Available categories (only categories with channels)
const availableCategories = computed(() => {
  const categorySet = new Set(channels.value?.map(c => c.category).filter(Boolean) ?? [])
  return categories.filter(cat => categorySet.has(cat.value))
})

// Get category label
function getCategoryLabel(category: ChannelCategory): string {
  return categories.find(c => c.value === category)?.label ?? category
}
</script>

<template>
  <div class="explore-page">
    <!-- Header -->
    <header class="page-header">
      <NuxtLink to="/" class="back-link">
        ← Back to watching
      </NuxtLink>
      <h1 class="page-title">Explore Channels</h1>
    </header>

    <!-- Category Filter -->
    <div class="category-filter">
      <button
        class="filter-pill"
        :class="{ active: !selectedCategory }"
        @click="selectedCategory = null"
      >
        All
      </button>
      <button
        v-for="cat in availableCategories"
        :key="cat.value"
        class="filter-pill"
        :class="{ active: selectedCategory === cat.value }"
        @click="selectedCategory = cat.value"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Content -->
    <main class="content">
      <!-- Filtered View (single category) -->
      <template v-if="selectedCategory">
        <div class="category-section">
          <div class="channels-list">
            <ChannelCard
              v-for="channel in filteredChannels"
              :key="channel.id"
              :channel="channel"
              :creator="channel.creator"
            />
          </div>
        </div>
      </template>

      <!-- All Categories View -->
      <template v-else>
        <div
          v-for="[category, categoryChannels] in channelsByCategory"
          :key="category"
          class="category-section"
        >
          <h2 class="category-header">
            {{ getCategoryLabel(category) }}
            <span class="channel-count">({{ categoryChannels.length }})</span>
          </h2>
          <div class="channels-list">
            <ChannelCard
              v-for="channel in categoryChannels"
              :key="channel.id"
              :channel="channel"
              :creator="channel.creator"
              :show-category="false"
            />
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <div v-if="!channels?.length" class="empty-state">
        <p>No channels available yet.</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.explore-page {
  min-height: 100vh;
  background: transparent;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 32px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(244, 239, 230, 0.03), transparent);
}

.back-link {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.15s;
}

.back-link:hover {
  color: var(--color-accent);
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  font-family: var(--font-display);
  margin: 0;
}

.category-filter {
  display: flex;
  gap: 8px;
  padding: 16px 32px;
  border-bottom: 1px solid var(--color-border-subtle);
  overflow-x: auto;
}

.filter-pill {
  padding: 8px 16px;
  border: 1px solid rgba(244, 239, 230, 0.18);
  background: rgba(15, 14, 12, 0.6);
  color: var(--color-text-tertiary);
  font-size: 13px;
  font-family: inherit;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.filter-pill:hover {
  border-color: rgba(215, 161, 103, 0.5);
  color: var(--color-text-secondary);
}

.filter-pill.active {
  border-color: rgba(215, 161, 103, 0.7);
  color: var(--color-bg-primary);
  background: linear-gradient(120deg, rgba(215, 161, 103, 0.9), rgba(111, 196, 184, 0.8));
  box-shadow: var(--shadow-glow);
}

.content {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.category-section {
  margin-bottom: 48px;
}

.category-header {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-display);
  margin: 0 0 16px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.channel-count {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-muted);
}

.channels-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(15, 14, 12, 0.65);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.channels-list :deep(.channel-row:last-child) {
  border-bottom: none;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: var(--color-text-muted);
  font-size: 14px;
}

@media (max-width: 900px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 20px 20px;
  }

  .category-filter {
    padding: 12px 20px;
  }

  .content {
    padding: 24px 20px;
  }
}

@media (max-width: 640px) {
  .page-title {
    font-size: 20px;
  }

  .filter-pill {
    padding: 10px 14px;
    font-size: 12px;
  }

  .content {
    padding: 20px 16px;
  }
}
</style>
