<script setup lang="ts">
import type { ChannelScheduleItem } from '~/types/database'
import { usePersistentPlayer } from '~/composables/usePersistentPlayer'

const route = useRoute()
const router = useRouter()

const player = usePersistentPlayer()
const playerRef = ref<{ pause: () => void; play: () => void } | null>(null)
const playerShellRef = ref<HTMLElement | null>(null)
const showScheduleModal = ref(false)

const isWatchRoute = computed(() => route.name === 'index' || route.name === 'slug')

const scheduleList = computed(() => (Array.isArray(player.schedule.value) ? player.schedule.value : []))
const timelineValue = computed(() => player.timeline.value ?? null)
const channelTitle = computed(() => player.currentChannel.value?.title ?? '')
const playbackStateValue = computed(() => player.playbackState.value ?? null)
const showChannelList = computed(() => player.showChannelList.value)

const hasPlayableChannel = computed(() => {
  return !!(
    !player.channelsError.value
    && !player.errorMessage.value
    && player.currentChannel.value
    && scheduleList.value.length > 0
    && timelineValue.value
  )
})

const canRenderPlayer = computed(() => scheduleList.value.length > 0 && !!timelineValue.value)

const isDockHidden = computed(() => !isWatchRoute.value && player.dockHidden.value)

const nextVideo = computed<ChannelScheduleItem | null>(() => {
  if (!player.playbackState.value || !player.schedule.value.length) return null
  const nextIndex = player.playbackState.value.currentVideoIndex + 1
  if (nextIndex >= player.schedule.value.length) return null
  return player.schedule.value[nextIndex] ?? null
})

const channelsList = computed(() => player.channels.value ?? [])

const currentChannelSlug = computed(() => player.currentChannel.value?.slug ?? null)

const dockPosition = ref({ x: 0, y: 0 })
const dockHasPosition = ref(false)
const dockDragging = ref(false)
const dockOffset = ref({ x: 0, y: 0 })

const dockStyle = computed(() => {
  if (isWatchRoute.value) return {}
  return {
    left: `${dockPosition.value.x}px`,
    top: `${dockPosition.value.y}px`,
  }
})

async function handleSelectChannel(slug: string) {
  await player.loadChannelBySlug(slug)
  const routeSlug = typeof route.params.slug === 'string' ? route.params.slug : null
  if (route.name !== 'slug' || routeSlug !== slug) {
    router.push(`/${slug}`)
  }
}

function handleHideDock() {
  player.hideDock()
  playerRef.value?.pause()
}

function handleShowDock() {
  player.showDock()
  playerRef.value?.play()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function ensureDockPosition() {
  if (!playerShellRef.value) return
  if (dockHasPosition.value) return
  const rect = playerShellRef.value.getBoundingClientRect()
  const margin = window.innerWidth <= 640 ? 12 : 24
  dockPosition.value = {
    x: Math.max(margin, window.innerWidth - rect.width - margin),
    y: Math.max(margin, window.innerHeight - rect.height - margin),
  }
  dockHasPosition.value = true
}

function handleDockPointerMove(event: PointerEvent) {
  if (!dockDragging.value || !playerShellRef.value) return
  const rect = playerShellRef.value.getBoundingClientRect()
  const margin = window.innerWidth <= 640 ? 12 : 24
  const maxX = Math.max(margin, window.innerWidth - rect.width - margin)
  const maxY = Math.max(margin, window.innerHeight - rect.height - margin)
  dockPosition.value = {
    x: clamp(event.clientX - dockOffset.value.x, margin, maxX),
    y: clamp(event.clientY - dockOffset.value.y, margin, maxY),
  }
}

function stopDockDrag() {
  dockDragging.value = false
  window.removeEventListener('pointermove', handleDockPointerMove)
  window.removeEventListener('pointerup', stopDockDrag)
  window.removeEventListener('pointercancel', stopDockDrag)
}

function handleDockPointerDown(event: PointerEvent) {
  if (isWatchRoute.value || !playerShellRef.value) return
  const target = event.target as HTMLElement | null
  if (target?.closest('button, a')) return
  const rect = playerShellRef.value.getBoundingClientRect()
  dockDragging.value = true
  dockHasPosition.value = true
  dockOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
  window.addEventListener('pointermove', handleDockPointerMove)
  window.addEventListener('pointerup', stopDockDrag)
  window.addEventListener('pointercancel', stopDockDrag)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab' || event.key === 'c') {
    event.preventDefault()
    player.toggleChannelList()
  }
}

async function syncChannelForRoute() {
  await player.loadChannels()
  const routeSlug = typeof route.params.slug === 'string' ? route.params.slug : null
  if (route.name === 'slug' && routeSlug) {
    await player.loadChannelBySlug(routeSlug)
    return
  }

  if (player.currentChannel.value) return

  const lastSlug = player.lastPlayedSlug.value
  if (lastSlug) {
    await player.loadChannelBySlug(lastSlug)
    if (player.currentChannel.value) return
  }

  await player.ensureDefaultChannel()
}

onMounted(async () => {
  await syncChannelForRoute()
  window.addEventListener('keydown', handleKeydown)
  if (!isWatchRoute.value && !isDockHidden.value) {
    nextTick(() => {
      ensureDockPosition()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopDockDrag()
})

watch(
  () => [route.name, route.params.slug],
  () => {
    syncChannelForRoute()
  }
)

watch(
  () => [isWatchRoute.value, isDockHidden.value],
  () => {
    if (!isWatchRoute.value && !isDockHidden.value) {
      nextTick(() => {
        ensureDockPosition()
      })
    }
  }
)
</script>

<template>
  <div v-if="hasPlayableChannel" class="persistent-player" :class="{ full: isWatchRoute, dock: !isWatchRoute }">
    <div v-show="!isDockHidden" class="player-shell" :style="dockStyle" ref="playerShellRef">
      <div class="player-container">
        <ChannelPlayer
          v-if="canRenderPlayer"
          ref="playerRef"
          :schedule="scheduleList"
          :timeline="timelineValue"
          :controls-variant="isWatchRoute ? 'full' : 'minimal'"
          @playback-state="player.setPlaybackState"
          @error="player.setPlayerError"
        />

        <NowPlaying
          v-if="isWatchRoute && channelTitle"
          :channel-title="channelTitle"
          :state="playbackStateValue"
          :next-video="nextVideo"
          @show-schedule="showScheduleModal = true"
        />

        <div v-else class="dock-meta" @pointerdown="handleDockPointerDown">
          <div class="dock-actions">
            <NuxtLink
              v-if="currentChannelSlug"
              :to="`/${currentChannelSlug}`"
              class="dock-link"
            >
              Back to channel
            </NuxtLink>
            <button class="dock-hide" type="button" @click="handleHideDock" aria-label="Hide player">
              <svg class="dock-close-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 0 0-1.4 1.4L10.6 12l-4.9 4.9a1 1 0 1 0 1.4 1.4L12 13.4l4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <transition name="slide">
        <ChannelSidebar
          v-if="isWatchRoute && showChannelList"
          :channels="channelsList"
          :current-slug="currentChannelSlug"
          @select="handleSelectChannel"
        />
      </transition>
    </div>

    <button
      v-if="isDockHidden"
      class="dock-resume"
      type="button"
      @click="handleShowDock"
    >
      Resume playback
    </button>

    <ScheduleModal
      v-if="showScheduleModal && canRenderPlayer"
      :schedule="scheduleList"
      :timeline="timelineValue"
      :playback-state="playbackStateValue"
      @close="showScheduleModal = false"
    />
  </div>
</template>

<style scoped>
.persistent-player {
  width: 100%;
  position: relative;
  z-index: 10;
}

.persistent-player.full {
  height: 100vh;
}

.persistent-player.dock {
  pointer-events: none;
}

.player-shell {
  height: 100%;
  display: flex;
  pointer-events: auto;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.persistent-player.full .player-shell {
  height: 100%;
}

  .persistent-player.dock .player-shell {
    position: fixed;
    left: 24px;
    top: 24px;
    width: 360px;
    height: 202px;
    border-radius: 16px;
  overflow: hidden;
  background: rgba(12, 11, 9, 0.92);
  border: 1px solid rgba(244, 239, 230, 0.12);
  box-shadow: var(--shadow-soft);
  animation: dock-in 0.24s ease;
}

.player-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

  .dock-meta {
    position: absolute;
    left: 12px;
    right: 12px;
    top: 12px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 8px 10px;
    background: rgba(11, 10, 8, 0.7);
    border: 1px solid rgba(244, 239, 230, 0.1);
    border-radius: 999px;
    backdrop-filter: blur(8px);
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  .persistent-player.dock .dock-meta {
    cursor: grab;
  }

  .persistent-player.dock .dock-meta:active {
    cursor: grabbing;
  }

  .dock-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }

.dock-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  border: 1px solid rgba(244, 239, 230, 0.12);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  transition: all var(--transition-fast);
}

.dock-link:hover {
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-text-primary);
}

  .dock-hide {
    background: transparent;
    border: 1px solid rgba(244, 239, 230, 0.14);
    border-radius: 999px;
    color: var(--color-text-secondary);
    font-size: 11px;
    padding: 4px 8px;
    cursor: pointer;
    transition: all var(--transition-fast);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .dock-hide:hover {
    border-color: rgba(215, 161, 103, 0.6);
    color: var(--color-text-primary);
  }

  .dock-close-icon {
    width: 14px;
    height: 14px;
    display: block;
  }

.dock-resume {
  position: fixed;
  right: 24px;
  bottom: 24px;
  background: rgba(12, 11, 9, 0.9);
  border: 1px solid rgba(244, 239, 230, 0.14);
  border-radius: 999px;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 8px 14px;
  cursor: pointer;
  box-shadow: var(--shadow-soft);
  transition: all var(--transition-fast);
  z-index: 20;
}

.dock-resume:hover {
  border-color: rgba(215, 161, 103, 0.6);
  color: var(--color-text-primary);
}

@keyframes dock-in {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

  @media (max-width: 640px) {
    .persistent-player.dock .player-shell,
    .dock-resume {
      left: 12px;
      top: 12px;
    }

  .persistent-player.dock .player-shell {
    width: 280px;
    height: 158px;
  }
}
</style>
