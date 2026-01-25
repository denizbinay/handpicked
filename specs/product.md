# Product Specification

## Product Definition

Handpicked is a web-based, lean-back video experience that recreates the feeling of linear television using curated YouTube content.

Users do not browse videos.  
They tune into channels.

When a channel is opened, something is already playing.  
The content progresses in real time, independent of the viewer.

---

## Core Idea

The core idea of Handpicked is **shared linear playback**.

- Each channel represents a curated sequence of videos
- Playback follows a fixed timeline
- All viewers on a channel see the same video at the same point in time
- Joining a channel late means joining in-progress, not at the beginning

This mirrors traditional television rather than on-demand streaming.

---

## Target Audience

Handpicked is primarily designed for:

- People who already watch a lot of YouTube
- Technical or nerdy users comfortable with tool-like interfaces
- Viewers who want background or passive content
- Curators who enjoy assembling and programming content

The product does not target:
- casual mass-market viewers
- short-form or attention-optimized consumption
- algorithm-driven discovery

---

## Viewer Experience

Viewers:

- Do not need an account
- Arrive on the site and immediately see a channel playing
- Can switch between channels
- Can control volume/mute, fullscreen, and quality
- Can pause and resume (resume always re-syncs to live)
- Cannot scrub, skip, or select videos

There is no interaction with individual videos.

The viewer experience is intentionally minimal:
- no recommendations
- no feeds
- no personalization
- no history or "continue watching"

### Attribution and Transparency

While viewers cannot interact with videos, they should have access to **information** about what they're watching. This serves transparency and gives proper credit to original creators.

Above the fold: lean-back, minimal, channel-focused.
Below the fold: informational, attribution, transparency.

Displaying attribution info is encouraged. This includes:
- Current video title and original YouTube channel
- Link to the original video on YouTube
- Curator information

This is not feature creep—it's ethical transparency. Original YouTube creators retain their views, ad revenue, and visibility. We don't hide them.

---

## Channel Model

A channel is the primary unit of the product.

Each channel:

- Is curated by a human creator
- Consists of an ordered list of YouTube videos
- Plays continuously according to a real-time schedule
- Can loop once the playlist ends

Videos are played strictly in the order defined by the curator.  
Randomization is not allowed.

Scheduling is linear and deterministic:
- the channel timeline exists independently of viewers
- playback does not reset per viewer
- skipping ahead to “now” is required when joining mid-video

---

## Curators / Creators

Creators are real users with accounts.

- Creator access is private
- Viewer access is fully public
- Authentication for creators should be lightweight (e.g. magic link)

Creators can:

- Create and manage channels
- Define channel metadata (name, description)
- Add YouTube videos in a fixed order
- Define whether a channel loops after completion

Creator workflows should be simple and fast.
The product assumes that, especially early on, only a small number of creators will exist.

---

## What This Product Is NOT

Handpicked is explicitly not:

- A YouTube replacement
- A video-on-demand platform
- A recommendation engine
- A social network
- A chat-first experience
- A learning platform or productivity tool

If a feature pushes the product toward interactivity, personalization, or algorithmic discovery, it should be rejected by default.

---

## Scope and Maturity

This specification describes a **public prototype**, not a finished product.

The goals of the prototype are:

- To validate the linear-channel concept
- To test whether people enjoy lean-back, curated YouTube viewing
- To gather qualitative feedback from early users (e.g. Reddit)

Scalability, moderation, monetization, and advanced creator tooling are out of scope for V0.

---

## Open Questions (Intentionally Deferred)

The following topics are intentionally not fully specified yet:

- Detailed creator UI
- Moderation and abuse handling
- Chat or social features
- Analytics or popularity metrics
- Advanced scheduling (time-of-day programming)

These should only be addressed after validating the core experience.
