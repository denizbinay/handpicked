<script setup lang="ts">
import type { Channel, CreatorProfile } from '~/types/database'

defineProps<{
  channel: Channel | null
  creator: CreatorProfile | null
}>()
</script>

<template>
  <div class="below-the-fold">
    <div class="content-wrapper">
      <ChannelInfo :channel="channel" :creator="creator" />
    </div>
    <Footer />
  </div>
</template>

<style scoped>
.below-the-fold {
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  padding: var(--space-3xl) var(--space-xl);
}

@media (max-width: 900px) {
  .content-wrapper {
    padding: var(--space-2xl) var(--space-lg);
  }
}

@media (max-width: 640px) {
  .content-wrapper {
    padding: var(--space-xl) var(--space-md);
  }
}
</style>
