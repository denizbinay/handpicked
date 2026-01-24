<script setup lang="ts">
import type { Channel, CreatorProfile } from '~/types/database'

definePageMeta({
  middleware: 'curator-auth',
})

const supabase = useSupabaseClient()
const router = useRouter()

// Get user info for display
const userEmail = ref<string | null>(null)
const userId = ref<string | null>(null)

// Profile state
const profile = ref<CreatorProfile | null>(null)
const isEditingProfile = ref(false)
const isSavingProfile = ref(false)
const editDisplayName = ref('')
const editAvatarUrl = ref('')
const editBio = ref('')
const editWebsiteUrl = ref('')
const editSocialTwitter = ref('')
const editSocialGithub = ref('')
const editSocialInstagram = ref('')
const editSocialYoutube = ref('')

// Fetch curator's profile and channels
const { data: channels, refresh: refreshChannels } = await useAsyncData(
  'curator-channels',
  async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUserId = sessionData.session?.user?.id

    if (!currentUserId) return []

    // Store user info
    userId.value = currentUserId
    userEmail.value = sessionData.session?.user?.email || null

    // Fetch profile
    const { data: profileData } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('id', currentUserId)
      .single()

    if (profileData) {
      profile.value = profileData as CreatorProfile
      initProfileForm()
    }

    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('created_by', currentUserId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch channels:', error)
      return []
    }

    return data as Channel[]
  }
)

function initProfileForm() {
  if (!profile.value) return
  editDisplayName.value = profile.value.display_name || ''
  editAvatarUrl.value = profile.value.avatar_url || ''
  editBio.value = profile.value.bio || ''
  editWebsiteUrl.value = profile.value.website_url || ''
  const social = profile.value.social_links || {}
  editSocialTwitter.value = social.twitter || ''
  editSocialGithub.value = social.github || ''
  editSocialInstagram.value = social.instagram || ''
  editSocialYoutube.value = social.youtube || ''
}

async function saveProfile() {
  if (!userId.value) return

  isSavingProfile.value = true

  const socialLinks: Record<string, string> = {}
  if (editSocialTwitter.value) socialLinks.twitter = editSocialTwitter.value
  if (editSocialGithub.value) socialLinks.github = editSocialGithub.value
  if (editSocialInstagram.value) socialLinks.instagram = editSocialInstagram.value
  if (editSocialYoutube.value) socialLinks.youtube = editSocialYoutube.value

  const { error } = await supabase
    .from('creator_profiles')
    .update({
      display_name: editDisplayName.value || null,
      avatar_url: editAvatarUrl.value || null,
      bio: editBio.value || null,
      website_url: editWebsiteUrl.value || null,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
    })
    .eq('id', userId.value)

  isSavingProfile.value = false

  if (error) {
    alert('Failed to save profile')
    return
  }

  // Update local state
  if (profile.value) {
    profile.value.display_name = editDisplayName.value || null
    profile.value.avatar_url = editAvatarUrl.value || null
    profile.value.bio = editBio.value || null
    profile.value.website_url = editWebsiteUrl.value || null
    profile.value.social_links = Object.keys(socialLinks).length > 0 ? socialLinks : null
  }

  isEditingProfile.value = false
}

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
        <span class="user-email">{{ userEmail }}</span>
      </div>
      <div class="header-right">
        <NuxtLink to="/" class="link-button">View as Viewer</NuxtLink>
        <button class="logout-button" @click="handleLogout">Logout</button>
      </div>
    </header>

    <main class="main">
      <!-- Profile Section -->
      <section v-if="profile" class="profile-section">
        <div class="section-header">
          <h2>Your Profile</h2>
          <div class="header-meta">
            <span class="username">@{{ profile.username }}</span>
            <button
              v-if="!isEditingProfile"
              class="edit-button"
              @click="isEditingProfile = true"
            >
              Edit
            </button>
          </div>
        </div>

        <div v-if="!isEditingProfile" class="profile-display">
          <div class="profile-row">
            <img
              v-if="profile.avatar_url"
              :src="profile.avatar_url"
              class="profile-avatar"
            />
            <div v-else class="profile-avatar-placeholder"></div>
            <div class="profile-info">
              <span class="display-name">{{ profile.display_name || 'No display name' }}</span>
              <span class="bio">{{ profile.bio || 'No bio' }}</span>
            </div>
          </div>
          <div v-if="profile.website_url" class="profile-website">
            <a :href="profile.website_url" target="_blank" rel="noopener">
              {{ profile.website_url.replace(/^https?:\/\//, '') }}
            </a>
          </div>
          <div v-if="profile.social_links && Object.keys(profile.social_links).length > 0" class="profile-social">
            <span v-for="(handle, platform) in profile.social_links" :key="platform" class="social-badge">
              {{ platform }}
            </span>
          </div>
        </div>

        <form v-else class="profile-form" @submit.prevent="saveProfile">
          <div class="form-group">
            <label>Display Name</label>
            <input v-model="editDisplayName" type="text" placeholder="Your name" />
          </div>
          <div class="form-group">
            <label>Avatar URL</label>
            <input v-model="editAvatarUrl" type="url" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label>Bio</label>
            <textarea v-model="editBio" rows="3" placeholder="A short bio about you"></textarea>
          </div>
          <div class="form-group">
            <label>Website</label>
            <input v-model="editWebsiteUrl" type="url" placeholder="https://yoursite.com" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Twitter/X</label>
              <input v-model="editSocialTwitter" type="text" placeholder="handle or URL" />
            </div>
            <div class="form-group">
              <label>GitHub</label>
              <input v-model="editSocialGithub" type="text" placeholder="handle or URL" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Instagram</label>
              <input v-model="editSocialInstagram" type="text" placeholder="handle or URL" />
            </div>
            <div class="form-group">
              <label>YouTube</label>
              <input v-model="editSocialYoutube" type="text" placeholder="handle or URL" />
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-button" @click="isEditingProfile = false; initProfileForm()">
              Cancel
            </button>
            <button type="submit" class="save-button" :disabled="isSavingProfile">
              {{ isSavingProfile ? 'Saving...' : 'Save Profile' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Channels Section -->
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

/* Profile Section */
.profile-section {
  background: #111;
  border: 1px solid #222;
  border-radius: 8px;
  margin-bottom: 24px;
}

.profile-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #222;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 13px;
  color: #666;
  font-family: ui-monospace, monospace;
}

.edit-button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #333;
  border-radius: 4px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
}

.edit-button:hover {
  border-color: #555;
  color: #fff;
}

.profile-display {
  padding: 20px;
}

.profile-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #333;
}

.profile-avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #222;
  border: 2px solid #333;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.display-name {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

.bio {
  font-size: 13px;
  color: #888;
}

.profile-website {
  margin-bottom: 12px;
}

.profile-website a {
  font-size: 13px;
  color: #4af;
  text-decoration: none;
}

.profile-website a:hover {
  text-decoration: underline;
}

.profile-social {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.social-badge {
  font-size: 11px;
  padding: 4px 8px;
  background: #222;
  border-radius: 4px;
  color: #888;
  text-transform: capitalize;
}

.profile-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 12px;
  color: #666;
}

.form-group input,
.form-group textarea {
  padding: 10px 12px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #555;
  outline: none;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
}

.cancel-button,
.save-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.cancel-button {
  background: transparent;
  border: 1px solid #333;
  color: #888;
}

.cancel-button:hover {
  border-color: #555;
  color: #fff;
}

.save-button {
  background: #fff;
  border: none;
  color: #000;
  font-weight: 500;
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
