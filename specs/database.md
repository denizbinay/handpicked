# Database Specification (v0.1)

This document defines the authoritative data model for Handpicked.
It describes what must be stored and why, not how it is queried or optimized.

---

## Design Principles

- The database represents **objective truth**, not UI state
- Viewer-specific data is intentionally minimal
- Playback state is derived, not stored
- Time is the primary axis of the system

---

## Core Entities

### Channel

A channel represents a curated, linear broadcast.

Required fields:
- id (unique identifier)
- slug (public identifier, stable)
- title
- description
- created_by (creator account reference)
- is_public (boolean)
- created_at
- updated_at

Admin-managed fields:
- is_highlight (boolean, default false) - Whether channel appears in sidebar highlights
- highlight_order (integer, nullable) - Explicit ordering for highlight channels

Optional profile fields:
- avatar_url (square image URL for channel icon)
- banner_url (header/banner image URL)
- curator_name (display name of the curator)
- curator_bio (short bio/description of the curator)
- website_url (curator's website)
- social_links (JSON object with social media links)

Rules:
- Channels are the primary public objects
- Viewers never interact with videos directly
- All playback happens through channels

Highlight rules:
- highlight_order is null when is_highlight is false
- highlight_order is a sequential integer (0-based) when is_highlight is true
- Order is explicit and manually set by admins
- Newly added highlights are appended to the end (highest order + 1)
- Removing a highlight clears highlight_order and compacts remaining orders
- All highlight consumers (sidebar, default channel) use highlight_order for ordering

---

### Channel Schedule

Defines the ordered list of videos for a channel.

Required fields:
- id
- channel_id (FK → Channel)
- position (integer, explicit ordering)
- youtube_video_id
- duration_seconds (cached)
- created_at
- is_disabled (boolean, default false)

Availability tracking fields:
- last_error_code (integer, nullable) - YouTube error code on last failure
- last_error_message (text, nullable) - Human-readable error description
- last_checked_at (timestamp, nullable) - When availability was last verified

Cached video metadata (from YouTube API, for attribution):
- title (video title)
- youtube_channel_name (original creator's channel name)
- youtube_channel_id (for linking)
- thumbnail_url (video thumbnail)
- published_at (original publish date)

Rules:
- Order is explicit, not inferred
- Videos must play strictly in this order
- No randomness or algorithmic reshuffling
- Disabled schedule entries remain visible to curators but are excluded from playback
- Videos are auto-disabled on playback errors (100, 101, 150, 153) and can be manually re-enabled
- Re-enabling triggers a fresh availability check; if still unavailable, the video stays disabled

---

### Channel Timeline

Defines how a channel maps to real time.

Required fields:
- channel_id (PK, FK → Channel)
- start_time (timestamp, UTC)

Rules:
- start_time anchors the entire channel playback
- Playback position = (now - start_time) modulo total schedule duration
- Timeline is global and shared by all viewers

The timeline MUST NOT be duplicated per user.

---

### Creator Account

Represents users who can create and manage channels.

Required fields:
- id
- email
- created_at
- last_login_at

Rules:
- Creator accounts require authentication
- Viewer accounts do not exist
- All channels are owned by exactly one creator

---

## Authentication Model

- Authentication exists for creators and admins
- Magic-link / passwordless login is sufficient
- Roles in v0.1: “creator”, “admin”
- Admins may impersonate creator accounts for support and maintenance
- Impersonation must be explicit, time-bound, and auditable

Public viewers:
- Are anonymous
- Are not stored
- Do not generate persistent records

---

## Derived Data (Not Stored)

The following MUST be computed at runtime and not persisted:

- Current video for a channel
- Current playback offset
- Viewer position
- “What’s playing now” labels

Storing derived playback state is forbidden in v0.1.

---

## Data Integrity Rules

- Deleting a channel deletes its schedule and timeline
- Videos cannot exist without a channel
- A channel without a schedule is invalid
- A channel without a start_time cannot be played

---

## Non-Goals (Explicit)

- No analytics tables
- No viewer tracking
- No watch history
- No per-user preferences
- No algorithmic metadata

---

## Migration Expectations

- Schema changes are expected early
- Backwards compatibility is not required in v0.1
- Data loss during early iteration is acceptable

---

## Open Questions (Deferred)

- Whether channel timelines can be paused or reset
- Whether schedules can be edited while live
- Whether multiple timelines per channel ever exist

These are intentionally unresolved.
