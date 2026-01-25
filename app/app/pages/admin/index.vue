<script setup lang="ts">
import type { SystemStats } from '~/composables/useAdmin'

definePageMeta({
  middleware: 'admin-auth',
})

const { getSystemStats } = useAdmin()

const stats = ref<SystemStats | null>(null)
const loading = ref(true)

onMounted(async () => {
  stats.value = await getSystemStats()
  loading.value = false
})
</script>

<template>
  <div class="admin-page">
    <header class="header">
      <div class="header-left">
        <h1>Admin Dashboard</h1>
      </div>
      <div class="header-right">
        <NuxtLink to="/curator" class="link-button">Curator Panel</NuxtLink>
        <NuxtLink to="/" class="link-button">View Site</NuxtLink>
      </div>
    </header>

    <main class="main">
      <!-- Stats Cards -->
      <section class="stats-section">
        <div v-if="loading" class="loading">Loading stats...</div>
        <template v-else-if="stats">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalChannels }}</div>
              <div class="stat-label">Channels</div>
              <div class="stat-detail">{{ stats.publicChannels }} public</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalCurators }}</div>
              <div class="stat-label">Curators</div>
              <div class="stat-detail">{{ stats.adminCurators }} admins</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalVideos }}</div>
              <div class="stat-label">Videos</div>
              <div class="stat-detail">in schedules</div>
            </div>
          </div>
        </template>
      </section>

      <!-- Navigation -->
      <section class="nav-section">
        <h2>Manage</h2>
        <div class="nav-grid">
          <NuxtLink to="/admin/channels" class="nav-card">
            <span class="nav-title">All Channels</span>
            <span class="nav-desc">View and manage all channels</span>
          </NuxtLink>
          <NuxtLink to="/admin/curators" class="nav-card">
            <span class="nav-title">Curators</span>
            <span class="nav-desc">Manage curator accounts</span>
          </NuxtLink>
          <NuxtLink to="/admin/highlights" class="nav-card">
            <span class="nav-title">Highlights</span>
            <span class="nav-desc">Manage featured channels</span>
          </NuxtLink>
        </div>
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

.header-left h1 {
  font-size: 18px;
  font-weight: 600;
  font-family: var(--font-display);
}

.header-right {
  display: flex;
  gap: 12px;
}

.link-button {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 999px;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-tertiary);
  text-decoration: none;
}

.link-button:hover {
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-text-primary);
}

.main {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
}

.loading {
  color: var(--color-text-muted);
  font-size: 14px;
}

.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: rgba(15, 14, 12, 0.85);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: 600;
  font-family: var(--font-display);
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.stat-detail {
  font-size: 12px;
  color: var(--color-text-muted);
}

.nav-section h2 {
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.nav-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: rgba(15, 14, 12, 0.85);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all 0.15s;
}

.nav-card:hover {
  border-color: rgba(215, 161, 103, 0.6);
  background: rgba(215, 161, 103, 0.08);
}

.nav-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-primary);
  font-family: var(--font-display);
}

.nav-desc {
  font-size: 13px;
  color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-right {
    flex-wrap: wrap;
  }

  .stats-grid,
  .nav-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .main {
    padding: 24px 16px;
  }
}
</style>
