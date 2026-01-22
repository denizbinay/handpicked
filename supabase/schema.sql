-- Handpicked Database Schema v0.1
-- Based on specs/database.md

-- ============================================
-- CREATOR ACCOUNTS
-- ============================================
-- Represents users who can create and manage channels.
-- Viewers do not have accounts.

create table public.creator_accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now() not null,
  last_login_at timestamptz
);

-- Link to Supabase Auth
alter table public.creator_accounts enable row level security;

create policy "Creators can read own account"
  on public.creator_accounts for select
  using (auth.uid() = id);

create policy "Creators can update own account"
  on public.creator_accounts for update
  using (auth.uid() = id);


-- ============================================
-- CHANNELS
-- ============================================
-- A channel represents a curated, linear broadcast.

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  created_by uuid references public.creator_accounts(id) on delete cascade not null,
  is_public boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.channels enable row level security;

-- Anyone can read public channels
create policy "Public channels are readable by all"
  on public.channels for select
  using (is_public = true);

-- Creators can read their own channels (public or private)
create policy "Creators can read own channels"
  on public.channels for select
  using (auth.uid() = created_by);

-- Creators can insert their own channels
create policy "Creators can create channels"
  on public.channels for insert
  with check (auth.uid() = created_by);

-- Creators can update their own channels
create policy "Creators can update own channels"
  on public.channels for update
  using (auth.uid() = created_by);

-- Creators can delete their own channels
create policy "Creators can delete own channels"
  on public.channels for delete
  using (auth.uid() = created_by);


-- ============================================
-- CHANNEL SCHEDULES
-- ============================================
-- Defines the ordered list of videos for a channel.
-- Order is explicit via position field.

create table public.channel_schedules (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade not null,
  position integer not null,
  youtube_video_id text not null,
  title text, -- cached from YouTube
  duration_seconds integer not null,
  created_at timestamptz default now() not null,

  -- Ensure unique position per channel
  unique (channel_id, position)
);

alter table public.channel_schedules enable row level security;

-- Anyone can read schedules for public channels
create policy "Schedules for public channels are readable"
  on public.channel_schedules for select
  using (
    exists (
      select 1 from public.channels
      where channels.id = channel_schedules.channel_id
      and channels.is_public = true
    )
  );

-- Creators can read schedules for their own channels
create policy "Creators can read own channel schedules"
  on public.channel_schedules for select
  using (
    exists (
      select 1 from public.channels
      where channels.id = channel_schedules.channel_id
      and channels.created_by = auth.uid()
    )
  );

-- Creators can manage schedules for their own channels
create policy "Creators can insert own channel schedules"
  on public.channel_schedules for insert
  with check (
    exists (
      select 1 from public.channels
      where channels.id = channel_schedules.channel_id
      and channels.created_by = auth.uid()
    )
  );

create policy "Creators can update own channel schedules"
  on public.channel_schedules for update
  using (
    exists (
      select 1 from public.channels
      where channels.id = channel_schedules.channel_id
      and channels.created_by = auth.uid()
    )
  );

create policy "Creators can delete own channel schedules"
  on public.channel_schedules for delete
  using (
    exists (
      select 1 from public.channels
      where channels.id = channel_schedules.channel_id
      and channels.created_by = auth.uid()
    )
  );


-- ============================================
-- CHANNEL TIMELINES
-- ============================================
-- Maps a channel to real time via start_time.
-- Playback position = (now - start_time) % total_duration

create table public.channel_timelines (
  channel_id uuid primary key references public.channels(id) on delete cascade,
  start_time timestamptz not null
);

alter table public.channel_timelines enable row level security;

-- Anyone can read timelines for public channels
create policy "Timelines for public channels are readable"
  on public.channel_timelines for select
  using (
    exists (
      select 1 from public.channels
      where channels.id = channel_timelines.channel_id
      and channels.is_public = true
    )
  );

-- Creators can read timelines for their own channels
create policy "Creators can read own channel timelines"
  on public.channel_timelines for select
  using (
    exists (
      select 1 from public.channels
      where channels.id = channel_timelines.channel_id
      and channels.created_by = auth.uid()
    )
  );

-- Creators can manage timelines for their own channels
create policy "Creators can insert own channel timelines"
  on public.channel_timelines for insert
  with check (
    exists (
      select 1 from public.channels
      where channels.id = channel_timelines.channel_id
      and channels.created_by = auth.uid()
    )
  );

create policy "Creators can update own channel timelines"
  on public.channel_timelines for update
  using (
    exists (
      select 1 from public.channels
      where channels.id = channel_timelines.channel_id
      and channels.created_by = auth.uid()
    )
  );


-- ============================================
-- HELPER FUNCTION: Update updated_at
-- ============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger channels_updated_at
  before update on public.channels
  for each row execute function public.handle_updated_at();
