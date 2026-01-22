// YouTube IFrame API Type Definitions

declare namespace YT {
  class Player {
    constructor(elementId: string, options: PlayerOptions)
    loadVideoById(options: { videoId: string; startSeconds?: number }): void
    cueVideoById(options: { videoId: string; startSeconds?: number }): void
    playVideo(): void
    pauseVideo(): void
    stopVideo(): void
    seekTo(seconds: number, allowSeekAhead: boolean): void
    mute(): void
    unMute(): void
    isMuted(): boolean
    setVolume(volume: number): void
    getVolume(): number
    getPlayerState(): number
    getCurrentTime(): number
    getDuration(): number
    getVideoUrl(): string
    getVideoEmbedCode(): string
    destroy(): void
  }

  interface PlayerOptions {
    height?: string | number
    width?: string | number
    videoId?: string
    playerVars?: PlayerVars
    events?: PlayerEvents
  }

  interface PlayerVars {
    autoplay?: 0 | 1
    cc_lang_pref?: string
    cc_load_policy?: 1
    color?: 'red' | 'white'
    controls?: 0 | 1 | 2
    disablekb?: 0 | 1
    enablejsapi?: 0 | 1
    end?: number
    fs?: 0 | 1
    hl?: string
    iv_load_policy?: 1 | 3
    list?: string
    listType?: 'playlist' | 'search' | 'user_uploads'
    loop?: 0 | 1
    modestbranding?: 1
    origin?: string
    playlist?: string
    playsinline?: 0 | 1
    rel?: 0 | 1
    showinfo?: 0 | 1
    start?: number
    mute?: 0 | 1
  }

  interface PlayerEvents {
    onReady?: (event: PlayerEvent) => void
    onStateChange?: (event: OnStateChangeEvent) => void
    onPlaybackQualityChange?: (event: OnPlaybackQualityChangeEvent) => void
    onPlaybackRateChange?: (event: OnPlaybackRateChangeEvent) => void
    onError?: (event: OnErrorEvent) => void
    onApiChange?: (event: PlayerEvent) => void
  }

  interface PlayerEvent {
    target: Player
  }

  interface OnStateChangeEvent extends PlayerEvent {
    data: number
  }

  interface OnPlaybackQualityChangeEvent extends PlayerEvent {
    data: string
  }

  interface OnPlaybackRateChangeEvent extends PlayerEvent {
    data: number
  }

  interface OnErrorEvent extends PlayerEvent {
    data: number
  }

  const PlayerState: {
    UNSTARTED: -1
    ENDED: 0
    PLAYING: 1
    PAUSED: 2
    BUFFERING: 3
    CUED: 5
  }
}
