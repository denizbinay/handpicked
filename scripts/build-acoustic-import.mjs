import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SOURCE = path.join(ROOT, 'data', 'seed', 'channels', 'acoustic-sessions', 'schedule.json')
const OUT_DIR = path.join(ROOT, 'data', 'seed', 'channels', 'acoustic-sessions', 'chunks')
const CHUNK_SIZE = 25

const raw = fs.readFileSync(SOURCE, 'utf8')
const cleaned = raw.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ')
const data = JSON.parse(cleaned)

fs.mkdirSync(OUT_DIR, { recursive: true })

for (let i = 0; i < data.length; i += CHUNK_SIZE) {
  const chunk = data.slice(i, i + CHUNK_SIZE)
  const json = JSON.stringify(chunk, null, 2)
  const sql = [
    "insert into public.channel_schedules (",
    "  channel_id,",
    "  position,",
    "  youtube_video_id,",
    "  title,",
    "  duration_seconds,",
    "  youtube_channel_id,",
    "  youtube_channel_name,",
    "  thumbnail_url,",
    "  published_at,",
    "  is_disabled",
    ")",
    "select",
    "  (select id from public.channels where slug = 'acoustic-sessions'),",
    "  payload.position,",
    "  payload.youtube_video_id,",
    "  payload.title,",
    "  payload.duration_seconds,",
    "  payload.youtube_channel_id,",
    "  payload.youtube_channel_name,",
    "  payload.thumbnail_url,",
    "  payload.published_at,",
    "  false",
    "from jsonb_to_recordset($$" + json + "$$::jsonb) as payload(",
    "  position int,",
    "  youtube_video_id text,",
    "  title text,",
    "  duration_seconds int,",
    "  youtube_channel_id text,",
    "  youtube_channel_name text,",
    "  thumbnail_url text,",
    "  published_at timestamptz",
    ")",
    "order by payload.position;",
    "",
  ].join('\n')

  const index = String(i / CHUNK_SIZE + 1).padStart(2, '0')
  const filePath = path.join(OUT_DIR, `chunk-${index}.sql`)
  fs.writeFileSync(filePath, sql)
}
