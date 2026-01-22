# Player Specification

This document defines the authoritative behavior of the Handpicked video player.
All implementations must conform to this behavior, even if UX or technical details change.

---

## Core Concept

The player simulates a TV-like broadcast.

- Playback is linear and time-based
- All viewers of a channel see the same video at the same timestamp
- The player represents a shared “now”, not individual sessions

---

## Playback Model

- Each channel has a continuous timeline
- Videos are scheduled sequentially on that timeline
- Playback position is derived from wall-clock time, not user interaction

When a viewer opens a channel:
- The player MUST calculate the current position based on the channel timeline
- The video MUST start at the correct offset
- Late joiners MUST skip ahead automatically

There is no concept of “start from beginning” for viewers.

---

## Autoplay Rules

- Autoplay is mandatory
- Playback starts immediately on channel load
- Muted autoplay is allowed if required by browser policies
- The system may unmute after user interaction, but must not pause

---

## Viewer Controls (Hard Constraints)

Viewers MUST NOT be able to:
- Pause playback
- Scrub or seek
- Skip to next or previous video
- Select individual videos
- Replay content

The ONLY allowed viewer action:
- Switch to a different channel

All other controls are forbidden.

---

## Synchronization Guarantees

- Two viewers opening the same channel at the same time MUST see the same frame
- Two viewers opening the same channel at different times MUST see different offsets
- Refreshing the page MUST NOT reset playback position

Minor drift (≤ a few seconds) is acceptable in early versions.
Perfect sync is not required for v0.1.

---

## Failure & Fallback Behavior

If playback cannot start immediately:
- The player should retry automatically
- A loading state is allowed
- Manual retry by the viewer is not required

If a video fails to load:
- The system should advance to the next scheduled video
- The channel timeline must continue

---

## Relationship to UX

This document defines **what must happen**, not **how it looks**.

UI decisions (layout, styling, labels) live elsewhere.
If a UX choice conflicts with this spec, the spec wins.

---

## Non-Goals (Explicit)

- No live chat
- No viewer interaction layer
- No per-user playback state
- No rewind, history, or “watch later”
- No adaptive bitrate logic specified at this level

---

## Open Questions (Deferred)

- Exact drift tolerance thresholds
- Cross-device sync accuracy guarantees
- Handling of very long videos (multi-hour)
- Browser autoplay edge cases

These are intentionally unresolved in v0.1.
