# Curator Specification (v0.1)

This document defines the role, capabilities, and constraints of curators
(the only authenticated users in the system).

---

## Definition

A curator is a human user who creates and maintains channels.
Curators are responsible for structure, order, and timing.
They do not interact with viewers.

---

## Account Model

- Curators authenticate via magic-link (email-based)
- No passwords
- No public profiles in v0.1
- No social features

A curator account is required to:
- Create channels
- Edit channel metadata
- Define channel schedules

---

## Curator Capabilities

A curator can:

- Create a new channel
- Set channel title and description
- Define an ordered list of YouTube videos
- Reorder videos manually
- Set or reset the channel start time
- Make a channel public or private

A curator cannot:
- Influence playback once a channel is live
- Override the global timeline per viewer
- Insert videos dynamically based on viewers

---

## Scheduling Model

- Videos are added in explicit order
- Order defines playback sequence
- Total runtime is derived from video durations
- Schedules may loop when reaching the end

Rules:
- No randomness
- No shuffling
- No algorithmic filling
- No gaps unless explicitly introduced later

---

## Editing Constraints

- Schedule edits affect future playback only
- Current playback is not rewound or interrupted
- Timeline integrity is prioritized over curator convenience

v0.1 assumption:
- Editing a live channel is allowed but conservative

---

## Visibility

- Curators can view their own channels regardless of public status
- Public channels are visible to all viewers
- Private channels are accessible only via direct URL

---

## Non-Goals (Explicit)

- No curator analytics
- No follower counts
- No monetization
- No collaboration between curators
- No moderation of viewer behavior (no chat in v0.1)

---

## Mental Model (Authoritative)

Curators program time, not content feeds.

They are closer to TV schedulers than to YouTube creators.
