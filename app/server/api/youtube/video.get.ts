/**
 * YouTube Video Info API
 *
 * Fetches video metadata (title, duration) from YouTube Data API v3.
 * Used when curators add videos to automatically get duration.
 *
 * GET /api/youtube/video?id=VIDEO_ID
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const videoId = query.id as string

  if (!videoId) {
    throw createError({
      statusCode: 400,
      message: 'Missing video ID',
    })
  }

  // Extract video ID from URL if full URL was provided
  const extractedId = extractVideoId(videoId)

  if (!extractedId) {
    throw createError({
      statusCode: 400,
      message: 'Invalid YouTube video ID or URL',
    })
  }

  const apiKey = config.youtubeApiKey

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'YouTube API key not configured',
    })
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
        new URLSearchParams({
          part: 'snippet,contentDetails',
          id: extractedId,
          key: apiKey,
        })
    )

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: 'YouTube API request failed',
      })
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Video not found',
      })
    }

    const video = data.items[0]
    const duration = parseDuration(video.contentDetails.duration)

    return {
      id: extractedId,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      publishedAt: video.snippet.publishedAt,
      duration_seconds: duration,
      thumbnail: video.snippet.thumbnails?.medium?.url || null,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to fetch video info',
    })
  }
})

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(input: string): string | null {
  // Already a video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input
  }

  // Try to parse as URL
  try {
    const url = new URL(input)

    // youtube.com/watch?v=VIDEO_ID
    if (url.hostname.includes('youtube.com')) {
      return url.searchParams.get('v')
    }

    // youtu.be/VIDEO_ID
    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1)
    }
  } catch {
    // Not a valid URL
  }

  return null
}

/**
 * Parse ISO 8601 duration to seconds
 * Example: PT4M13S -> 253 seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)

  if (!match) {
    return 0
  }

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  return hours * 3600 + minutes * 60 + seconds
}
