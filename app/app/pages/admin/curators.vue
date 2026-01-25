<script setup lang="ts">
import type { CuratorWithProfile } from '~/composables/useAdmin'

definePageMeta({
  middleware: 'admin-auth',
})

const supabase = useSupabaseClient()
const { getAllCurators, toggleAdminStatus } = useAdmin()

const curators = ref<CuratorWithProfile[]>([])
const loading = ref(true)
const currentUserId = ref<string | null>(null)

async function loadCurators() {
  loading.value = true

  // Get current user ID
  const { data: userData } = await supabase.auth.getUser()
  currentUserId.value = userData.user?.id || null

  curators.value = await getAllCurators()
  loading.value = false
}

onMounted(loadCurators)

async function handleToggleAdmin(curator: CuratorWithProfile) {
  // Prevent self-demotion
  if (curator.id === currentUserId.value && curator.is_admin) {
    alert('You cannot remove your own admin status')
    return
  }

  const newStatus = !curator.is_admin
  const action = newStatus ? 'promote to admin' : 'remove admin status'

  if (!confirm(`Are you sure you want to ${action} for @${curator.creator_profiles?.username || curator.email}?`)) {
    return
  }

  const success = await toggleAdminStatus(curator.id, newStatus)
  if (success) {
    curator.is_admin = newStatus
  } else {
    alert('Failed to update admin status')
  }
}
</script>

<template>
  <div class="admin-page">
    <header class="header">
      <div class="header-left">
        <NuxtLink to="/admin" class="back-link">← Back</NuxtLink>
        <h1>Curators</h1>
      </div>
    </header>

    <main class="main">
      <div class="curators-section">
        <div v-if="loading" class="loading">Loading curators...</div>
        <div v-else-if="curators.length === 0" class="empty">
          No curators found
        </div>
        <ul v-else class="curators-list">
          <li
            v-for="curator in curators"
            :key="curator.id"
            class="curator-item"
          >
            <div class="curator-avatar">
              <img
                v-if="curator.creator_profiles?.avatar_url"
                :src="curator.creator_profiles.avatar_url"
                :alt="curator.creator_profiles?.display_name || 'Avatar'"
              />
              <div v-else class="avatar-placeholder"></div>
            </div>
            <div class="curator-info">
              <div class="curator-name">
                <span class="display-name">
                  {{ curator.creator_profiles?.display_name || 'No display name' }}
                </span>
                <span v-if="curator.is_admin" class="admin-badge">ADMIN</span>
                <span v-if="curator.id === currentUserId" class="you-badge">YOU</span>
              </div>
              <span class="username">
                @{{ curator.creator_profiles?.username || 'no-username' }}
              </span>
              <span class="email">{{ curator.email }}</span>
            </div>
            <div class="curator-actions">
              <button
                v-if="curator.is_admin"
                class="action-button danger"
                :disabled="curator.id === currentUserId"
                :title="curator.id === currentUserId ? 'Cannot remove own admin' : 'Remove admin'"
                @click="handleToggleAdmin(curator)"
              >
                Remove Admin
              </button>
              <button
                v-else
                class="action-button"
                @click="handleToggleAdmin(curator)"
              >
                Make Admin
              </button>
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
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.curators-section {
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

.curators-list {
  list-style: none;
}

.curator-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
  gap: 16px;
}

.curator-item:last-child {
  border-bottom: none;
}

.curator-avatar {
  flex-shrink: 0;
}

.curator-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(244, 239, 230, 0.12);
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(244, 239, 230, 0.05);
  border: 2px solid rgba(244, 239, 230, 0.12);
}

.curator-info {
  flex: 1;
  min-width: 0;
}

.curator-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.display-name {
  font-weight: 500;
  font-family: var(--font-display);
  color: var(--color-text-primary);
}

.admin-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: rgba(215, 161, 103, 0.15);
  color: var(--color-accent);
}

.you-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: rgba(111, 196, 184, 0.15);
  color: #6fc4b8;
}

.username {
  display: block;
  font-size: 13px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  margin-bottom: 2px;
}

.email {
  display: block;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.curator-actions {
  flex-shrink: 0;
}

.action-button {
  padding: 8px 16px;
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}

.action-button:hover:not(:disabled) {
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-text-primary);
}

.action-button.danger {
  border-color: rgba(239, 138, 122, 0.4);
  color: var(--color-text-tertiary);
}

.action-button.danger:hover:not(:disabled) {
  border-color: rgba(239, 138, 122, 0.8);
  color: #ef8a7a;
}

.action-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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

  .curator-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .curator-actions {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .main {
    padding: 24px 16px;
  }
}
</style>
