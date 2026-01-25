import type { Channel, CreatorProfile } from '~/types/database'

export function useChannelDetails() {
  const supabase = useSupabaseClient()

  const channel = ref<Channel | null>(null)
  const creator = ref<CreatorProfile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadCreator(channelData: Channel) {
    const { data: creatorData, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('id', channelData.created_by)
      .single()

    if (creatorError || !creatorData) {
      creator.value = null
      return
    }

    creator.value = creatorData as CreatorProfile
  }

  async function loadChannelDetailsBySlug(slug: string | null) {
    isLoading.value = true
    error.value = null

    try {
      if (!slug) {
        const { data, error: channelError } = await supabase
          .from('channels')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: true })
          .limit(1)

        if (channelError) {
          error.value = channelError.message
          channel.value = null
          creator.value = null
          return
        }

        const channelData = data?.[0] ?? null
        channel.value = channelData as Channel | null
        creator.value = null

        if (channelData) {
          await loadCreator(channelData as Channel)
        }

        return
      }

      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('slug', slug)
        .eq('is_public', true)
        .single()

      if (channelError || !channelData) {
        error.value = channelError?.message || 'Channel not found'
        channel.value = null
        creator.value = null
        return
      }

      channel.value = channelData as Channel
      creator.value = null
      await loadCreator(channelData as Channel)
    } finally {
      isLoading.value = false
    }
  }

  return {
    channel,
    creator,
    isLoading,
    error,
    loadChannelDetailsBySlug,
  }
}
