<script setup lang="ts">
const route = useRoute()
const { channel, creator, isLoading, error, loadChannelDetailsBySlug } = useChannelDetails()

const slug = computed(() => (typeof route.params.slug === 'string' ? route.params.slug : null))

onMounted(() => {
  watch(
    slug,
    (value) => {
      loadChannelDetailsBySlug(value)
    },
    { immediate: true }
  )
})
</script>

<template>
  <div class="app">
    <!-- Error State -->
    <div v-if="error && !isLoading && !channel" class="error-screen">
      <div class="error-content">
        <h1>Error</h1>
        <p>{{ error }}</p>
        <NuxtLink to="/" class="back-link">Go to home</NuxtLink>
      </div>
    </div>

    <!-- No Channels State -->
    <div v-else-if="!isLoading && !channel" class="empty-screen">
      <div class="empty-content">
        <h1 class="brand">Handpicked</h1>
        <p class="tagline">Curated TV for the internet</p>

        <div class="explanation">
          <p>
            Handpicked is like television &mdash; you tune in, something is playing,
            and you can't skip ahead. Channels are curated by humans,
            not algorithms.
          </p>
        </div>

        <div class="status">
          <span class="status-dot"></span>
          No channels are live yet
        </div>

        <p class="curator-cta">
          Are you a curator? <NuxtLink to="/curator/login">Sign in</NuxtLink>
        </p>
      </div>
    </div>

    <!-- Main Player View -->
    <div v-else class="player-page">
      <BelowTheFold :channel="channel" :creator="creator" />
    </div>
  </div>
</template>

<style>
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#__nuxt {
  height: 100%;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}
</style>

<style scoped>
.app {
  min-height: 0;
}

.error-screen,
.empty-screen {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.error-content,
.empty-content {
  max-width: 400px;
  padding: 32px;
}

.error-content h1,
.empty-content h1 {
  font-size: 26px;
  font-weight: 600;
  font-family: var(--font-display);
  margin-bottom: 12px;
}

.error-content p {
  color: var(--color-text-tertiary);
  font-size: 14px;
  margin-bottom: 16px;
}

.empty-content .brand {
  font-size: 42px;
  font-weight: 600;
  font-family: var(--font-display);
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}

.empty-content .tagline {
  font-size: 18px;
  color: var(--color-accent-cool);
  margin-bottom: 32px;
}

.empty-content .explanation {
  max-width: 360px;
  margin-bottom: 32px;
}

.empty-content .explanation p {
  font-size: 15px;
  color: var(--color-text-tertiary);
  line-height: 1.6;
}

.empty-content .status {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(244, 239, 230, 0.04);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 32px;
}

.empty-content .status-dot {
  width: 8px;
  height: 8px;
  background: var(--color-accent);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.empty-content .curator-cta {
  font-size: 13px;
  color: var(--color-text-muted);
}

.empty-content .curator-cta a {
  color: var(--color-text-tertiary);
  text-decoration: none;
}

.empty-content .curator-cta a:hover {
  color: var(--color-text-primary);
  text-decoration: underline;
}

.back-link {
  color: var(--color-accent);
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  text-decoration: underline;
}

.player-page {
  min-height: 0;
}

@media (max-width: 640px) {
  .error-content,
  .empty-content {
    max-width: 320px;
    padding: 24px;
  }

  .empty-content .brand {
    font-size: 34px;
  }

  .empty-content .tagline {
    font-size: 16px;
  }
}
</style>
