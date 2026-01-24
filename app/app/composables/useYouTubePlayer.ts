/**
 * YouTube IFrame Player API wrapper for Handpicked
 *
 * Enforces constraints:
 * - No pause
 * - No scrub/seek by user
 * - No video selection
 * - Autoplay is mandatory
 */

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

interface PlayerOptions {
  elementId: string
  onReady?: () => void
  onStateChange?: (state: number) => void
  onError?: (errorCode: number) => void
}

export function useYouTubePlayer() {
  let player: YT.Player | null = null
  let isApiReady = false
  const apiReadyCallbacks: (() => void)[] = []

  /**
   * Load the YouTube IFrame API script
   */
  function loadApi(): Promise<void> {
    return new Promise((resolve) => {
      if (isApiReady) {
        resolve()
        return
      }

      // Check if already loaded
      if (window.YT && window.YT.Player) {
        isApiReady = true
        resolve()
        return
      }

      // Queue callback
      apiReadyCallbacks.push(resolve)

      // Only load script once
      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        return
      }

      // Set up global callback
      window.onYouTubeIframeAPIReady = () => {
        isApiReady = true
        apiReadyCallbacks.forEach((cb) => cb())
        apiReadyCallbacks.length = 0
      }

      // Load script
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    })
  }

  /**
   * Create a new player instance
   */
  async function createPlayer(options: PlayerOptions): Promise<YT.Player> {
    await loadApi()

    return new Promise((resolve, reject) => {
      try {
        player = new window.YT.Player(options.elementId, {
          height: '100%',
          width: '100%',
          playerVars: {
            // Disable all user controls
            controls: 0,
            disablekb: 1,
            fs: 0, // No fullscreen button
            modestbranding: 1,
            rel: 0, // No related videos
            showinfo: 0,
            iv_load_policy: 3, // No annotations

            // Autoplay settings
            autoplay: 1,
            mute: 1, // Start muted (browser policy)

            // Playback
            playsinline: 1,
          },
          events: {
            onReady: () => {
              options.onReady?.()
              resolve(player!)
            },
            onStateChange: (event: YT.OnStateChangeEvent) => {
              options.onStateChange?.(event.data)
            },
            onError: (event: YT.OnErrorEvent) => {
              options.onError?.(event.data)
            },
          },
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Load a video and start at specific offset
   */
  function loadVideo(videoId: string, startSeconds: number = 0) {
    if (!player) return

    player.loadVideoById({
      videoId,
      startSeconds,
    })
  }

  /**
   * Cue a video without playing (for preloading)
   */
  function cueVideo(videoId: string, startSeconds: number = 0) {
    if (!player) return

    player.cueVideoById({
      videoId,
      startSeconds,
    })
  }

  /**
   * Play the current video
   */
  function play() {
    player?.playVideo()
  }

  /**
   * Unmute the player (after user interaction)
   */
  function unmute() {
    player?.unMute()
    player?.setVolume(100)
  }

  /**
   * Mute the player
   */
  function mute() {
    player?.mute()
  }

  /**
   * Check if player is muted
   */
  function isMuted(): boolean {
    return player?.isMuted() ?? true
  }

  /**
   * Set volume (0-100)
   */
  function setVolume(volume: number) {
    player?.setVolume(volume)
  }

  /**
   * Get current volume (0-100)
   */
  function getVolume(): number {
    return player?.getVolume() ?? 100
  }

  /**
   * Pause the player
   */
  function pause() {
    player?.pauseVideo()
  }

  /**
   * Get available quality levels
   */
  function getAvailableQualityLevels(): string[] {
    return player?.getAvailableQualityLevels() ?? []
  }

  /**
   * Set playback quality
   */
  function setPlaybackQuality(quality: string) {
    player?.setPlaybackQuality(quality)
  }

  /**
   * Get current playback quality
   */
  function getPlaybackQuality(): string {
    return player?.getPlaybackQuality() ?? 'auto'
  }

  /**
   * Get current playback time
   */
  function getCurrentTime(): number {
    return player?.getCurrentTime() ?? 0
  }

  /**
   * Seek to specific time (internal use only, not exposed to users)
   */
  function seekTo(seconds: number) {
    player?.seekTo(seconds, true)
  }

  /**
   * Get player state
   */
  function getState(): number {
    return player?.getPlayerState() ?? -1
  }

  /**
   * Destroy the player
   */
  function destroy() {
    player?.destroy()
    player = null
  }

  return {
    loadApi,
    createPlayer,
    loadVideo,
    cueVideo,
    play,
    pause,
    unmute,
    mute,
    isMuted,
    setVolume,
    getVolume,
    getCurrentTime,
    seekTo,
    getState,
    getAvailableQualityLevels,
    setPlaybackQuality,
    getPlaybackQuality,
    destroy,
  }
}

// YouTube Player States (from YT.PlayerState)
export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const
