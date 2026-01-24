<script setup lang="ts">
import type { Channel, CreatorProfile, ChannelCategory } from '~/types/database'

defineProps<{
  channel: Channel | null
  creator: CreatorProfile | null
}>()

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

function getSocialUrl(platform: string, handle: string): string {
  if (handle.startsWith('http')) return handle
  const urls: Record<string, (h: string) => string> = {
    twitter: (h) => `https://x.com/${h}`,
    github: (h) => `https://github.com/${h}`,
    instagram: (h) => `https://instagram.com/${h}`,
    youtube: (h) => `https://youtube.com/@${h}`,
    twitch: (h) => `https://twitch.tv/${h}`,
    bluesky: (h) => `https://bsky.app/profile/${h}`,
  }
  return urls[platform]?.(handle) || handle
}

const socialIcons: Record<string, string> = {
  twitter: '<path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.4-6.4M20 4l-6.4 6.4"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
  youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
  twitch: '<path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7"/>',
  bluesky: '<path d="M12 2L3 9.5c0 4.5 4 8 9 10.5 5-2.5 9-6 9-10.5L12 2z"/>',
  website: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
}
</script>

<template>
  <section v-if="channel" class="channel-info">
    <div class="grid">
      <!-- Left: Channel Info -->
      <div class="channel-section">
        <div class="channel-header">
          <span v-if="channel.category" class="category-badge">
            {{ CATEGORY_LABELS[channel.category] }}
          </span>
          <h2 class="channel-title">{{ channel.title }}</h2>
        </div>

        <p v-if="channel.description" class="channel-description">
          {{ channel.description }}
        </p>
      </div>

      <!-- Right: Curator Info -->
      <div v-if="creator" class="curator-section">
        <div class="curator-header">
          <img
            v-if="creator.avatar_url"
            :src="creator.avatar_url"
            :alt="creator.display_name || creator.username"
            class="curator-avatar"
          />
          <div v-else class="curator-avatar-placeholder"></div>

          <div class="curator-identity">
            <span class="curator-label">Curated by</span>
            <span class="curator-name">{{ creator.display_name || creator.username }}</span>
            <span class="curator-username">@{{ creator.username }}</span>
          </div>
        </div>

        <div class="curator-footer">
          <div class="curator-links">
            <a
              v-if="creator.website_url"
              :href="creator.website_url"
              target="_blank"
              rel="noopener"
              class="icon-link"
              title="Website"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="socialIcons.website" />
            </a>
            <template v-if="creator.social_links">
              <a
                v-for="(handle, platform) in creator.social_links"
                :key="platform"
                :href="getSocialUrl(platform, handle)"
                target="_blank"
                rel="noopener"
                class="icon-link"
                :title="platform"
              >
                <svg
                  v-if="socialIcons[platform]"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  v-html="socialIcons[platform]"
                />
              </a>
            </template>
          </div>

          <NuxtLink :to="`/@${creator.username}`" class="profile-link">
            View profile &rarr;
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.channel-info {
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 300px;
}

/* Channel Section (Left) */
.channel-section {
  padding: 28px;
  border-right: 1px solid #1a1a1a;
}

.channel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.category-badge {
  font-size: 11px;
  padding: 4px 10px;
  background: rgba(100, 170, 255, 0.1);
  color: #6af;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.channel-title {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.02em;
}

.channel-description {
  font-size: 15px;
  color: #888;
  line-height: 1.6;
}

/* Curator Section (Right) */
.curator-section {
  padding: 24px;
  display: flex;
  flex-direction: column;
  background: #080808;
}

.curator-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.curator-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #333;
  flex-shrink: 0;
}

.curator-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1a1a1a;
  border: 2px solid #333;
  flex-shrink: 0;
}

.curator-identity {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.curator-label {
  font-size: 10px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.curator-name {
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.curator-username {
  font-size: 12px;
  color: #555;
  font-family: ui-monospace, monospace;
}

.curator-footer {
  margin-top: auto;
  padding-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.curator-links {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  color: #666;
  text-decoration: none;
  transition: all 0.15s;
}

.icon-link:hover {
  border-color: #4af;
  color: #4af;
  background: rgba(68, 170, 255, 0.05);
}

.profile-link {
  font-size: 12px;
  color: #666;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.15s;
}

.profile-link:hover {
  color: #4af;
}

/* Mobile: Stack vertically */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .channel-section {
    border-right: none;
    border-bottom: 1px solid #1a1a1a;
    padding: 20px;
  }

  .channel-title {
    font-size: 20px;
  }

  .curator-section {
    padding: 20px;
  }

  .curator-footer {
    padding-top: 14px;
  }
}
</style>
