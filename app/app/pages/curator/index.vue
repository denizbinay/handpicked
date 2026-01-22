<script setup lang="ts">
import type { Channel } from '~/types/database'

definePageMeta({
  middleware: 'curator-auth',
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

// Fetch curator's channels
const { data: channels, refresh: refreshChannels } = await useAsyncData(
  'curator-channels',
  async () => {
    if (!user.value) return []

    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('created_by', user.value.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch channels:', error)
      return []
    }

    return data as Channel[]
  }
)

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/curator/login')
}

async function deleteChannel(channelId: string) {
  if (!confirm('Are you sure you want to delete this channel?')) {
    return
  }

  const { error } = await supabase.from('channels').delete().eq('id', channelId)

  if (error) {
    alert('Failed to delete channel')
    return
  }

  refreshChannels()
}
</script>

<template>
  <div class="curator-page">
    <header class="header">
      <div class="header-left">
        <h1>Curator Dashboard</h1>
        <span class="user-email">{{ user?.email }}</span>
      </div>
      <div class="header-right">
        <NuxtLink to="/" class="link-button">View as Viewer</NuxtLink>
        <button class="logout-button" @click="handleLogout">Logout</button>
      </div>
    </header>

    <main class="main">
      <section class="channels-section">
        <div class="section-header">
          <h2>Your Channels</h2>
          <NuxtLink to="/curator/channels/new" class="create-button">
            + New Channel
          </NuxtLink>
        </div>

        <div v-if="!channels || channels.length === 0" class="empty-state">
          <p>You haven't created any channels yet.</p>
          <NuxtLink to="/curator/channels/new" class="create-link">
            Create your first channel
          </NuxtLink>
        </div>

        <ul v-else class="channels-list">
          <li v-for="channel in channels" :key="channel.id" class="channel-item">
            <div class="channel-info">
              <span class="channel-title">{{ channel.title }}</span>
              <span class="channel-slug">/{{ channel.slug }}</span>
              <span class="channel-status" :class="{ public: channel.is_public }">
                {{ channel.is_public ? 'Public' : 'Private' }}
              </span>
            </div>
            <div class="channel-actions">
              <NuxtLink
                :to="`/curator/channels/${channel.id}`"
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
              <button
                class="action-button danger"
                @click="deleteChannel(channel.id)"
              >
                Delete
              </button>
            </div>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style scoped>
.curator-page {
  min-height: 100vh;
  background: #0a0a0a;
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #222;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.header h1 {
  font-size: 18px;
  font-weight: 500;
}

.user-email {
  font-size: 13px;
  color: #666;
}

.header-right {
  display: flex;
  gap: 12px;
}

.link-button,
.logout-button {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}

.link-button {
  background: transparent;
  border: 1px solid #333;
  color: #888;
}

.link-button:hover {
  border-color: #555;
  color: #fff;
}

.logout-button {
  background: transparent;
  border: 1px solid #333;
  color: #888;
}

.logout-button:hover {
  border-color: #f55;
  color: #f55;
}

.main {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
}

.channels-section {
  background: #111;
  border: 1px solid #222;
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #222;
}

.section-header h2 {
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
}

.create-button {
  padding: 8px 16px;
  background: #fff;
  border: none;
  border-radius: 4px;
  color: #000;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.create-button:hover {
  opacity: 0.9;
}

.empty-state {
  padding: 48px 20px;
  text-align: center;
}

.empty-state p {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

.create-link {
  color: #4af;
  text-decoration: none;
  font-size: 14px;
}

.create-link:hover {
  text-decoration: underline;
}

.channels-list {
  list-style: none;
}

.channel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #222;
}

.channel-item:last-child {
  border-bottom: none;
}

.channel-info {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.channel-title {
  font-weight: 500;
}

.channel-slug {
  font-size: 13px;
  color: #666;
  font-family: ui-monospace, monospace;
}

.channel-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #333;
  color: #888;
}

.channel-status.public {
  background: rgba(0, 200, 100, 0.1);
  color: #0c8;
}

.channel-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 6px 12px;
  font-size: 12px;
  background: transparent;
  border: 1px solid #333;
  border-radius: 4px;
  color: #888;
  cursor: pointer;
  text-decoration: none;
}

.action-button:hover {
  border-color: #555;
  color: #fff;
}

.action-button.danger:hover {
  border-color: #f55;
  color: #f55;
}
</style>
