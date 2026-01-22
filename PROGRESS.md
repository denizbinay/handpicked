# Progress

## Current Status

**All core phases complete.** The app is ready for local testing.

---

## Completed

### Phase 1: Foundation

- [x] Database schema (`supabase/schema.sql`)
  - creator_accounts, channels, channel_schedules, channel_timelines tables
  - RLS policies for public/curator access
- [x] Seed data (`supabase/seed.sql`)
  - Test channels: lofi, tech-talks
  - Ready to run in Supabase SQL Editor
- [x] Nuxt configuration
  - @nuxtjs/supabase module
  - Environment variables configured
- [x] TypeScript types (`app/types/database.ts`, `app/types/youtube.d.ts`)

### Phase 2: Core Player

- [x] Timeline calculation (`app/composables/useChannelTimeline.ts`)
  - Shared playback position: (now - start_time) % total_duration
  - Video advancement logic
- [x] YouTube player wrapper (`app/composables/useYouTubePlayer.ts`)
  - IFrame API integration
  - All controls disabled
  - Muted autoplay (browser policy compliance)
- [x] ChannelPlayer component (`app/components/ChannelPlayer.vue`)
  - Auto-sync to timeline
  - Auto-advance to next video
  - Unmute button
- [x] NowPlaying component (`app/components/NowPlaying.vue`)
- [x] ChannelList component (`app/components/ChannelList.vue`)
  - Keyboard shortcuts (1-9, Tab/C)
- [x] Viewer pages (`app/pages/index.vue`, `app/pages/[slug].vue`)
  - Auto-play first public channel
  - Channel switching

### Phase 3: YouTube Data Integration

- [x] Server API route (`app/server/api/youtube/video.get.ts`)
  - Fetch video title and duration from YouTube Data API v3
  - Accepts video ID or full YouTube URL
  - ISO 8601 duration parsing

### Phase 4: Curator Dashboard

- [x] Magic-link authentication via Supabase Auth
- [x] Login page (`app/pages/curator/login.vue`)
- [x] Auth confirm page (`app/pages/curator/confirm.vue`)
- [x] Auth middleware (`app/middleware/curator-auth.ts`)
- [x] Dashboard (`app/pages/curator/index.vue`)
  - List curator's channels
  - Delete channels
- [x] Create channel (`app/pages/curator/channels/new.vue`)
  - Auto-generate slug from title
  - Set public/private
- [x] Edit channel (`app/pages/curator/channels/[id].vue`)
  - Edit metadata
  - Add videos (auto-fetch info from YouTube)
  - Reorder videos (move up/down)
  - Remove videos
  - Reset timeline

---

## To Test Locally

### 1. Set up database

Go to Supabase → **SQL Editor** and run:
1. `supabase/schema.sql` (creates tables)
2. `supabase/seed.sql` (creates test data)

### 2. Start dev server

```bash
cd app
pnpm dev
```

### 3. Test viewer experience

Open http://localhost:3000
- Should auto-play the first public channel
- Press 1-9 to switch channels
- Press Tab or C to toggle channel list

### 4. Test curator dashboard

Open http://localhost:3000/curator/login
- Enter your email to receive magic link
- Create/edit channels
- Add videos by pasting YouTube URLs

---

## Architecture Summary

```
Viewer Flow:
  / → Fetch channels → Auto-play first → Show player

Curator Flow:
  /curator/login → Magic link → /curator → Manage channels

Playback Logic:
  position = (now - channel.start_time) % total_duration
  → Determines current video + offset
  → All viewers see same frame
```

---

## Future Enhancements (Not in Scope for v0.1)

- [ ] Error handling polish
- [ ] Mobile responsiveness
- [ ] Loading skeletons
- [ ] Drift correction (re-sync periodically)
- [ ] Production deployment (Vercel)
