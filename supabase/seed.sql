-- Seed Data for Handpicked (Development)
-- Run this AFTER schema.sql in the Supabase SQL Editor
--
-- This creates test data for development without requiring authentication.
-- For production, channels should be created by authenticated curators.

-- Temporarily disable RLS for seeding
alter table public.creator_accounts disable row level security;
alter table public.channels disable row level security;
alter table public.channel_schedules disable row level security;
alter table public.channel_timelines disable row level security;

-- Create a test creator account
insert into public.creator_accounts (id, email)
values ('00000000-0000-0000-0000-000000000001', 'test@handpicked.dev')
on conflict (id) do nothing;

-- Create test channels
insert into public.channels (id, slug, title, description, created_by, is_public)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'lofi',
    'Lofi Beats',
    'Relaxing lofi hip hop for studying and chilling',
    '00000000-0000-0000-0000-000000000001',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'tech-talks',
    'Tech Talks',
    'Programming conference talks and tech content',
    '00000000-0000-0000-0000-000000000001',
    true
  )
on conflict (id) do nothing;

-- Schedule for Lofi channel
-- Using real lofi YouTube videos with approximate durations
insert into public.channel_schedules (channel_id, position, youtube_video_id, title, duration_seconds)
values
  ('11111111-1111-1111-1111-111111111111', 0, 'jfKfPfyJRdk', 'lofi hip hop radio - beats to relax/study to', 3600),
  ('11111111-1111-1111-1111-111111111111', 1, '5qap5aO4i9A', 'lofi hip hop radio - beats to sleep/chill to', 3600),
  ('11111111-1111-1111-1111-111111111111', 2, 'rUxyKA_-grg', 'Chillhop Radio - jazzy & lofi hip hop beats', 3600)
on conflict (channel_id, position) do nothing;

-- Schedule for Tech Talks channel
-- Using shorter videos for easier testing
insert into public.channel_schedules (channel_id, position, youtube_video_id, title, duration_seconds)
values
  ('22222222-2222-2222-2222-222222222222', 0, 'dQw4w9WgXcQ', 'Test Video 1', 212),
  ('22222222-2222-2222-2222-222222222222', 1, '9bZkp7q19f0', 'Test Video 2', 252),
  ('22222222-2222-2222-2222-222222222222', 2, 'kJQP7kiw5Fk', 'Test Video 3', 290)
on conflict (channel_id, position) do nothing;

-- Set channel timelines (start_time = now)
insert into public.channel_timelines (channel_id, start_time)
values
  ('11111111-1111-1111-1111-111111111111', now()),
  ('22222222-2222-2222-2222-222222222222', now())
on conflict (channel_id) do update set start_time = now();

-- Re-enable RLS
alter table public.creator_accounts enable row level security;
alter table public.channels enable row level security;
alter table public.channel_schedules enable row level security;
alter table public.channel_timelines enable row level security;

-- Verify seed data
select
  c.title as channel,
  count(s.id) as video_count,
  sum(s.duration_seconds) as total_duration_seconds
from public.channels c
left join public.channel_schedules s on s.channel_id = c.id
group by c.id, c.title;
