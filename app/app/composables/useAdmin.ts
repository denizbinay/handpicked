import type { Channel, CreatorAccount, CreatorProfile } from '~/types/database'

export interface SystemStats {
  totalChannels: number
  publicChannels: number
  totalCurators: number
  adminCurators: number
  totalVideos: number
}

export interface ChannelWithCreator extends Channel {
  creator_profiles: CreatorProfile | null
}

export interface CuratorWithProfile extends CreatorAccount {
  creator_profiles: CreatorProfile | null
}

export function useAdmin() {
  const supabase = useSupabaseClient()

  function normalizeChannels(data: any[] | null): ChannelWithCreator[] {
    if (!data) return []

    return data.map((item) => ({
      ...(item as Channel),
      creator_profiles: item.creator_accounts?.creator_profiles ?? null,
    }))
  }

  /**
   * Check if current user is an admin
   */
  async function isAdmin(): Promise<boolean> {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return false

    const { data, error } = await supabase
      .from('creator_accounts')
      .select('is_admin')
      .eq('id', sessionData.session.user.id)
      .single()

    if (error || !data) return false
    return data.is_admin === true
  }

  /**
   * Get system-wide statistics
   */
  async function getSystemStats(): Promise<SystemStats> {
    const [channelsResult, curatorsResult, videosResult] = await Promise.all([
      supabase.from('channels').select('id, is_public', { count: 'exact' }),
      supabase.from('creator_accounts').select('id, is_admin', { count: 'exact' }),
      supabase.from('channel_schedules').select('id', { count: 'exact' }),
    ])

    const channels = channelsResult.data || []
    const curators = curatorsResult.data || []

    return {
      totalChannels: channelsResult.count || 0,
      publicChannels: channels.filter(c => c.is_public).length,
      totalCurators: curatorsResult.count || 0,
      adminCurators: curators.filter(c => c.is_admin).length,
      totalVideos: videosResult.count || 0,
    }
  }

  /**
   * Get all channels with creator info (admins can see all including private)
   */
  async function getAllChannels(): Promise<ChannelWithCreator[]> {
    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        creator_accounts!channels_created_by_fkey (
          creator_profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch all channels:', error)
      return []
    }

    return normalizeChannels(data)
  }

  /**
   * Toggle channel public/private visibility
   */
  async function toggleChannelVisibility(channelId: string, isPublic: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('channels')
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq('id', channelId)

    if (error) {
      console.error('Failed to toggle visibility:', error)
      return false
    }
    return true
  }

  /**
   * Toggle channel highlight status
   */
  async function toggleHighlight(channelId: string, isHighlight: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('channels')
      .update({ is_highlight: isHighlight, updated_at: new Date().toISOString() })
      .eq('id', channelId)

    if (error) {
      console.error('Failed to toggle highlight:', error)
      return false
    }
    return true
  }

  /**
   * Delete a schedule entry (video from timeline)
   */
  async function deleteScheduleEntry(entryId: string): Promise<boolean> {
    const { error } = await supabase
      .from('channel_schedules')
      .delete()
      .eq('id', entryId)

    if (error) {
      console.error('Failed to delete schedule entry:', error)
      return false
    }
    return true
  }

  /**
   * Get all curators with their profiles
   */
  async function getAllCurators(): Promise<CuratorWithProfile[]> {
    const { data, error } = await supabase
      .from('creator_accounts')
      .select(`
        *,
        creator_profiles (
          id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch curators:', error)
      return []
    }

    return data as CuratorWithProfile[]
  }

  /**
   * Toggle admin status for a user (cannot remove own admin)
   */
  async function toggleAdminStatus(userId: string, isAdmin: boolean): Promise<boolean> {
    // Prevent self-demotion
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session?.user.id === userId && !isAdmin) {
      console.error('Cannot remove your own admin status')
      return false
    }

    const { error } = await supabase
      .from('creator_accounts')
      .update({ is_admin: isAdmin })
      .eq('id', userId)

    if (error) {
      console.error('Failed to toggle admin status:', error)
      return false
    }
    return true
  }

  /**
   * Get a single channel by ID (for editing)
   */
  async function getChannel(channelId: string): Promise<ChannelWithCreator | null> {
    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        creator_accounts!channels_created_by_fkey (
          creator_profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('id', channelId)
      .single()

    if (error) {
      console.error('Failed to fetch channel:', error)
      return null
    }

    return normalizeChannels([data])[0] ?? null
  }

  /**
   * Update channel details (admin can update any channel)
   */
  async function updateChannel(channelId: string, updates: Partial<Channel>): Promise<boolean> {
    const { error } = await supabase
      .from('channels')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', channelId)

    if (error) {
      console.error('Failed to update channel:', error)
      return false
    }
    return true
  }

  /**
   * Get highlight channels
   */
  async function getHighlightChannels(): Promise<ChannelWithCreator[]> {
    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        creator_accounts!channels_created_by_fkey (
          creator_profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('is_highlight', true)
      .order('title', { ascending: true })

    if (error) {
      console.error('Failed to fetch highlight channels:', error)
      return []
    }

    return normalizeChannels(data)
  }

  /**
   * Get non-highlight public channels (for adding to highlights)
   */
  async function getNonHighlightChannels(): Promise<ChannelWithCreator[]> {
    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        creator_accounts!channels_created_by_fkey (
          creator_profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('is_highlight', false)
      .eq('is_public', true)
      .order('title', { ascending: true })

    if (error) {
      console.error('Failed to fetch non-highlight channels:', error)
      return []
    }

    return normalizeChannels(data)
  }

  return {
    isAdmin,
    getSystemStats,
    getAllChannels,
    toggleChannelVisibility,
    toggleHighlight,
    deleteScheduleEntry,
    getAllCurators,
    toggleAdminStatus,
    getChannel,
    updateChannel,
    getHighlightChannels,
    getNonHighlightChannels,
  }
}
