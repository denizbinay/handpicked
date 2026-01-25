<script setup lang="ts">
import type { CreatorProfile, Channel, ChannelCategory } from '~/types/database'

const route = useRoute()
const supabase = useSupabaseClient()

const username = computed(() => route.params.username as string)

const CATEGORY_LABELS: Record<ChannelCategory, string> = {
  tech: 'Tech',
  music: 'Music',
  documentary: 'Documentary',
  comedy: 'Comedy',
  gaming: 'Gaming',
  art: 'Art',
  science: 'Science',
  news: 'News',
}

// Fetch profile and channels
const { data, error } = await useAsyncData(
  `curator-${username.value}`,
  async () => {
    // Fetch profile by username
    const { data: profileData, error: profileError } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('username', username.value)
      .single()

    if (profileError || !profileData) {
      return { profile: null, channels: [] }
    }

    const profile = profileData as CreatorProfile

    // Fetch public channels for this curator
    const { data: channelsData } = await supabase
      .from('channels')
      .select('*')
      .eq('created_by', profile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    return {
      profile,
      channels: (channelsData || []) as Channel[],
    }
  }
)

const profile = computed(() => data.value?.profile || null)
const channels = computed(() => data.value?.channels || [])

const socialIcons: Record<string, { label: string; getUrl: (h: string) => string }> = {
  twitter: {
    label: 'X',
    getUrl: (h) => h.startsWith('http') ? h : `https://x.com/${h}`,
  },
  github: {
    label: 'GitHub',
    getUrl: (h) => h.startsWith('http') ? h : `https://github.com/${h}`,
  },
  instagram: {
    label: 'Instagram',
    getUrl: (h) => h.startsWith('http') ? h : `https://instagram.com/${h}`,
  },
  youtube: {
    label: 'YouTube',
    getUrl: (h) => h.startsWith('http') ? h : `https://youtube.com/@${h}`,
  },
}
</script>

<template>
  <div class="curator-page">
    <!-- Not Found -->
    <div v-if="error || !profile" class="not-found">
      <h1>Curator not found</h1>
      <p>No curator with the username @{{ username }} exists.</p>
      <NuxtLink to="/" class="home-link">Go to home</NuxtLink>
    </div>

    <!-- Profile View -->
    <div v-else class="profile-view">
      <header class="header">
        <NuxtLink to="/" class="back-link">&larr; Back to home</NuxtLink>
      </header>

      <main class="main">
        <!-- Profile Header -->
        <section class="profile-header">
          <img
            v-if="profile.avatar_url"
            :src="profile.avatar_url"
            :alt="profile.display_name || profile.username"
            class="avatar"
          />
          <div v-else class="avatar-placeholder"></div>

          <div class="profile-info">
            <h1 class="display-name">{{ profile.display_name || profile.username }}</h1>
            <span class="username">@{{ profile.username }}</span>

            <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>

            <div class="links">
              <a
                v-if="profile.website_url"
                :href="profile.website_url"
                target="_blank"
                rel="noopener"
                class="website-link"
              >
                {{ profile.website_url.replace(/^https?:\/\//, '') }}
              </a>

              <div v-if="profile.social_links && Object.keys(profile.social_links).length > 0" class="social-links">
                <a
                  v-for="(handle, platform) in profile.social_links"
                  :key="platform"
                  :href="socialIcons[platform]?.getUrl(handle) || handle"
                  target="_blank"
                  rel="noopener"
                  class="social-link"
                >
                  {{ socialIcons[platform]?.label || platform }}
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- Channels List -->
        <section class="channels-section">
          <h2>Channels</h2>

          <div v-if="channels.length === 0" class="no-channels">
            <p>No public channels yet.</p>
          </div>

          <ul v-else class="channels-list">
            <li v-for="channel in channels" :key="channel.id" class="channel-item">
              <NuxtLink :to="`/${channel.slug}`" class="channel-link">
                <div class="channel-header">
                  <span v-if="channel.category" class="category-badge">
                    {{ CATEGORY_LABELS[channel.category] }}
                  </span>
                  <h3 class="channel-title">{{ channel.title }}</h3>
                </div>
                <p v-if="channel.description" class="channel-description">
                  {{ channel.description }}
                </p>
                <span class="view-link">View channel &rarr;</span>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.curator-page {
  min-height: 100vh;
  background: transparent;
  color: var(--color-text-primary);
}

.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.not-found h1 {
  font-size: 24px;
  font-family: var(--font-display);
  font-weight: 600;
  margin-bottom: 8px;
}

.not-found p {
  color: var(--color-text-tertiary);
  margin-bottom: 24px;
}

.home-link {
  color: var(--color-accent);
  text-decoration: none;
}

.home-link:hover {
  text-decoration: underline;
}

.header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(244, 239, 230, 0.03), transparent);
}

.back-link {
  color: var(--color-text-tertiary);
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  color: var(--color-text-primary);
}

.main {
  max-width: 700px;
  margin: 0 auto;
  padding: 48px 24px;
}

.profile-header {
  display: flex;
  gap: 24px;
  margin-bottom: 48px;
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(244, 239, 230, 0.15);
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(244, 239, 230, 0.05);
  border: 3px solid rgba(244, 239, 230, 0.12);
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.display-name {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
  font-family: var(--font-display);
}

.username {
  font-size: 14px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.bio {
  margin-top: 16px;
  font-size: 15px;
  color: var(--color-text-tertiary);
  line-height: 1.6;
}

.links {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.website-link {
  font-size: 13px;
  color: var(--color-accent);
  text-decoration: none;
}

.website-link:hover {
  text-decoration: underline;
}

.social-links {
  display: flex;
  gap: 8px;
}

.social-link {
  font-size: 12px;
  padding: 4px 10px;
  background: rgba(244, 239, 230, 0.04);
  border: 1px solid rgba(244, 239, 230, 0.12);
  border-radius: 4px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: all 0.15s;
}

.social-link:hover {
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-accent);
}

.channels-section h2 {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.no-channels {
  padding: 32px;
  text-align: center;
  background: rgba(15, 14, 12, 0.8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.no-channels p {
  color: var(--color-text-muted);
  font-size: 14px;
}

.channels-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.channel-item {
  background: rgba(15, 14, 12, 0.8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.15s;
}

.channel-item:hover {
  border-color: rgba(215, 161, 103, 0.5);
}

.channel-link {
  display: block;
  padding: 20px;
  text-decoration: none;
  color: inherit;
}

.channel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.category-badge {
  font-size: 11px;
  padding: 3px 8px;
  background: rgba(215, 161, 103, 0.12);
  color: var(--color-accent);
  border-radius: 999px;
  font-weight: 500;
}

.channel-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-text-primary);
  font-family: var(--font-display);
}

.channel-description {
  font-size: 14px;
  color: var(--color-text-tertiary);
  line-height: 1.5;
  margin-bottom: 12px;
}

.view-link {
  font-size: 13px;
  color: var(--color-accent);
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .links {
    justify-content: center;
  }

  .display-name {
    font-size: 24px;
  }
}

@media (max-width: 640px) {
  .main {
    padding: 32px 16px;
  }
}
</style>
