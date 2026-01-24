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

- Authentication exists only for creators
- Magic-link / passwordless login is sufficient
- No roles beyond “creator” are required in v0.1

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
