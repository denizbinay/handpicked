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
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-link {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.15s;
}

.back-link:hover {
  color: #4af;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.category-filter {
  display: flex;
  gap: 8px;
  padding: 16px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  overflow-x: auto;
}

.filter-pill {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: #888;
  font-size: 13px;
  font-family: inherit;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.filter-pill:hover {
  border-color: rgba(255, 255, 255, 0.3);
  color: #ccc;
}

.filter-pill.active {
  border-color: #4af;
  color: #4af;
  background: rgba(68, 170, 255, 0.1);
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
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  margin: 0 0 16px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.channel-count {
  font-size: 13px;
  font-weight: 400;
  color: #666;
}

.channels-list {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
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
  color: #666;
  font-size: 14px;
}
</style>
