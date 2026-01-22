// Database types for Handpicked
// Matches supabase/schema.sql

export interface CreatorAccount {
  id: string
  email: string
  created_at: string
  last_login_at: string | null
}

export interface Channel {
  id: string
  slug: string
  title: string
  description: string | null
  created_by: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface ChannelScheduleItem {
  id: string
  channel_id: string
  position: number
  youtube_video_id: string
  title: string | null
  duration_seconds: number
  created_at: string
}

export interface ChannelTimeline {
  channel_id: string
  start_time: string
}

// Composite types for queries

export interface ChannelWithSchedule extends Channel {
  schedule: ChannelScheduleItem[]
  timeline: ChannelTimeline | null
}

// Computed playback state (derived at runtime, never stored)

export interface PlaybackState {
  channelId: string
  currentVideo: ChannelScheduleItem
  currentVideoIndex: number
  offsetSeconds: number // seconds into the current video
  totalDurationSeconds: number
}
