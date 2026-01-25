import type { Channel, ChannelScheduleItem, ChannelTimeline, PlaybackState, CreatorProfile } from '~/types/database'

export function usePersistentPlayer() {
  const supabase = useSupabaseClient()

  const channels = useState<Channel[] | null>('persistent-channels', () => null)
  const channelsError = useState<string | null>('persistent-channels-error', () => null)
  const isLoadingChannels = useState<boolean>('persistent-channels-loading', () => false)

  const currentChannel = useState<Channel | null>('persistent-current-channel', () => null)
  const currentCreator = useState<CreatorProfile | null>('persistent-current-creator', () => null)
  const schedule = useState<ChannelScheduleItem[]>('persistent-schedule', () => [])
  const timeline = useState<ChannelTimeline | null>('persistent-timeline', () => null)
  const playbackState = useState<PlaybackState | null>('persistent-playback-state', () => null)
  const errorMessage = useState<string | null>('persistent-player-error', () => null)

  const showChannelList = useState<boolean>('persistent-show-channel-list', () => true)
  const dockHidden = useState<boolean>('persistent-dock-hidden', () => false)

  const lastPlayedSlug = useState<string | null>('persistent-last-played-slug', () => null)
  const hasLoadedStoredSlug = useState<boolean>('persistent-last-slug-loaded', () => false)

  let channelsPromise: Promise<Channel[] | null> | null = null

  function ensureStoredSlugLoaded() {
    if (hasLoadedStoredSlug.value) return
    if (process.client) {
      const stored = localStorage.getItem('handpicked:last-channel-slug')
      if (stored) {
        lastPlayedSlug.value = stored
      }
    }
    hasLoadedStoredSlug.value = true
  }

  function setLastPlayedSlug(slug: string) {
    lastPlayedSlug.value = slug
    if (process.client) {
      localStorage.setItem('handpicked:last-channel-slug', slug)
    }
  }

  function clearLastPlayedSlug() {
    lastPlayedSlug.value = null
    if (process.client) {
      localStorage.removeItem('handpicked:last-channel-slug')
    }
  }

  async function loadChannels() {
    ensureStoredSlugLoaded()
    if (channels.value && channels.value.length > 0) return channels.value
    if (channelsPromise) return channelsPromise

    isLoadingChannels.value = true
    channelsError.value = null

    channelsPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: true })

        if (error) {
          channelsError.value = error.message
          return null
        }

        channels.value = data as Channel[]
        return channels.value
      } finally {
        isLoadingChannels.value = false
        channelsPromise = null
      }
    })()

    return channelsPromise
  }

  async function loadChannelBySlug(slug: string) {
    ensureStoredSlugLoaded()
    errorMessage.value = null

    if (!channels.value) {
      await loadChannels()
    }

    if (!channels.value || channels.value.length === 0) {
      errorMessage.value = channelsError.value || 'No channels available'
      return
    }

    const channel = channels.value?.find((c) => c.slug === slug) || null
    if (!channel) {
      errorMessage.value = 'Channel not found'
      if (lastPlayedSlug.value === slug) {
        clearLastPlayedSlug()
      }
      return
    }

    if (currentChannel.value?.id === channel.id && schedule.value.length > 0 && timeline.value) {
      return
    }

    currentChannel.value = channel
    setLastPlayedSlug(channel.slug)

    const { data: creatorData } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('id', channel.created_by)
      .single()

    currentCreator.value = creatorData as CreatorProfile | null

    const { data: scheduleData, error: scheduleError } = await supabase
      .from('channel_schedules')
      .select('*')
      .eq('channel_id', channel.id)
      .order('position', { ascending: true })

    if (scheduleError) {
      errorMessage.value = 'Failed to load schedule'
      schedule.value = []
      return
    }

    const scheduleItems = (scheduleData || []) as ChannelScheduleItem[]
    schedule.value = scheduleItems.filter((item) => !item.is_disabled)

    const { data: timelineData, error: timelineError } = await supabase
      .from('channel_timelines')
      .select('*')
      .eq('channel_id', channel.id)
      .single()

    if (timelineError || !timelineData) {
      errorMessage.value = 'Channel has no timeline'
      timeline.value = null
      return
    }

    timeline.value = timelineData as ChannelTimeline
  }

  async function ensureDefaultChannel() {
    ensureStoredSlugLoaded()
    if (!channels.value || channels.value.length === 0) return
    if (currentChannel.value) return

    // Find first highlight channel by highlight_order
    const highlightChannels = channels.value
      .filter((channel) => channel.is_highlight)
      .sort((a, b) => (a.highlight_order ?? 999) - (b.highlight_order ?? 999))

    const firstHighlight = highlightChannels[0]
    if (firstHighlight) {
      await loadChannelBySlug(firstHighlight.slug)
      return
    }

    const firstChannel = channels.value[0]
    if (firstChannel) {
      await loadChannelBySlug(firstChannel.slug)
    }
  }

  function setPlaybackState(state: PlaybackState) {
    playbackState.value = state
  }

  function setPlayerError(error: string) {
    errorMessage.value = error
  }

  function toggleChannelList() {
    showChannelList.value = !showChannelList.value
  }

  function hideDock() {
    dockHidden.value = true
  }

  function showDock() {
    dockHidden.value = false
  }

  return {
    channels,
    channelsError,
    isLoadingChannels,
    currentChannel,
    currentCreator,
    schedule,
    timeline,
    playbackState,
    errorMessage,
    showChannelList,
    dockHidden,
    lastPlayedSlug,
    ensureStoredSlugLoaded,
    loadChannels,
    loadChannelBySlug,
    ensureDefaultChannel,
    setPlaybackState,
    setPlayerError,
    toggleChannelList,
    hideDock,
    showDock,
  }
}
