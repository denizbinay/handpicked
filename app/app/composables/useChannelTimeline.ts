import type { ChannelScheduleItem, ChannelTimeline, PlaybackState } from '~/types/database'

/**
 * Calculates the current playback state for a channel based on wall-clock time.
 *
 * Core formula: position = (now - start_time) % total_duration
 *
 * This ensures all viewers see the same video at the same timestamp,
 * regardless of when they joined.
 */
export function useChannelTimeline() {
  /**
   * Calculate total duration of a channel schedule
   */
  function getTotalDuration(schedule: ChannelScheduleItem[]): number {
    return schedule
      .filter((item) => !item.is_disabled)
      .reduce((sum, item) => sum + item.duration_seconds, 0)
  }

  /**
   * Calculate current playback state
   *
   * @param schedule - Ordered list of videos
   * @param timeline - Channel timeline with start_time
   * @param now - Current timestamp (defaults to Date.now())
   * @returns PlaybackState or null if schedule is empty
   */
  function calculatePlaybackState(
    schedule: ChannelScheduleItem[],
    timeline: ChannelTimeline,
    now: Date = new Date()
  ): PlaybackState | null {
    if (schedule.length === 0) {
      return null
    }

    const playableSchedule = schedule
      .map((video, index) => ({ video, index }))
      .filter(({ video }) => !video.is_disabled)

    if (playableSchedule.length === 0) {
      return null
    }

    const totalDuration = playableSchedule.reduce((sum, item) => sum + item.video.duration_seconds, 0)
    if (totalDuration === 0) {
      return null
    }

    // Calculate seconds since channel started
    const startTime = new Date(timeline.start_time)
    const elapsedMs = now.getTime() - startTime.getTime()
    const elapsedSeconds = Math.floor(elapsedMs / 1000)

    // Handle negative elapsed (channel starts in the future)
    if (elapsedSeconds < 0) {
      return {
        channelId: timeline.channel_id,
        currentVideo: playableSchedule[0].video,
        currentVideoIndex: playableSchedule[0].index,
        offsetSeconds: 0,
        totalDurationSeconds: totalDuration,
      }
    }

    // Position within the looping schedule
    const positionInSchedule = elapsedSeconds % totalDuration

    // Find which video is currently playing
    let accumulatedDuration = 0
    for (let i = 0; i < playableSchedule.length; i++) {
      const entry = playableSchedule[i]
      const videoEnd = accumulatedDuration + entry.video.duration_seconds

      if (positionInSchedule < videoEnd) {
        return {
          channelId: timeline.channel_id,
          currentVideo: entry.video,
          currentVideoIndex: entry.index,
          offsetSeconds: positionInSchedule - accumulatedDuration,
          totalDurationSeconds: totalDuration,
        }
      }

      accumulatedDuration = videoEnd
    }

    // Fallback to first video (shouldn't happen with valid data)
    return {
      channelId: timeline.channel_id,
      currentVideo: playableSchedule[0].video,
      currentVideoIndex: playableSchedule[0].index,
      offsetSeconds: 0,
      totalDurationSeconds: totalDuration,
    }
  }

  /**
   * Get the next video in the schedule (with looping)
   */
  function getNextVideo(
    schedule: ChannelScheduleItem[],
    currentIndex: number
  ): { video: ChannelScheduleItem; index: number } | null {
    if (schedule.length === 0) return null

    for (let offset = 1; offset <= schedule.length; offset++) {
      const nextIndex = (currentIndex + offset) % schedule.length
      const candidate = schedule[nextIndex]
      if (!candidate.is_disabled) {
        return {
          video: candidate,
          index: nextIndex,
        }
      }
    }

    return null
  }

  /**
   * Calculate time until current video ends
   */
  function getTimeUntilNextVideo(
    currentVideo: ChannelScheduleItem,
    offsetSeconds: number
  ): number {
    return currentVideo.duration_seconds - offsetSeconds
  }

  return {
    getTotalDuration,
    calculatePlaybackState,
    getNextVideo,
    getTimeUntilNextVideo,
  }
}
