insert into public.channel_schedules (
  channel_id,
  position,
  youtube_video_id,
  title,
  duration_seconds,
  youtube_channel_id,
  youtube_channel_name,
  thumbnail_url,
  published_at,
  is_disabled
)
select
  (select id from public.channels where slug = 'acoustic-sessions'),
  payload.position,
  payload.youtube_video_id,
  payload.title,
  payload.duration_seconds,
  payload.youtube_channel_id,
  payload.youtube_channel_name,
  payload.thumbnail_url,
  payload.published_at,
  false
from jsonb_to_recordset($$[
  {
    "position": 125,
    "youtube_video_id": "dr2gFR0ElFQ",
    "title": "Tommy Emmanuel & John Knowles - How Deep is Your Love - 1/15/2019 - Paste Studios - New York, NY",
    "duration_seconds": 184,
    "youtube_channel_id": "UC_PscE_7n8SiMspieMGMK_A",
    "youtube_channel_name": "Paste Magazine",
    "thumbnail_url": "https://i.ytimg.com/vi/dr2gFR0ElFQ/hqdefault.jpg",
    "published_at": "2019-01-16T16:05:50Z",
    "score": 0.5008
  }
]$$::jsonb) as payload(
  position int,
  youtube_video_id text,
  title text,
  duration_seconds int,
  youtube_channel_id text,
  youtube_channel_name text,
  thumbnail_url text,
  published_at timestamptz
)
order by payload.position;
