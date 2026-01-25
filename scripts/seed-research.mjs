import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CHANNELS_DIR = path.join(ROOT, 'data', 'seed', 'channels')
const API_KEY = process.env.YOUTUBE_API_KEY
const MAX_QUERIES = Number(process.env.SEED_MAX_QUERIES || 3)
const MAX_ALLOWLIST = Number(process.env.SEED_MAX_ALLOWLIST || 8)

if (!API_KEY) {
  console.error('Missing YOUTUBE_API_KEY in environment.')
  process.exit(1)
}

function listChannelPlans() {
  const entries = fs.readdirSync(CHANNELS_DIR, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(CHANNELS_DIR, entry.name, 'plan.md'))
    .filter((planPath) => fs.existsSync(planPath))
}

function parsePlan(planContent) {
  const lines = planContent.split(/\r?\n/)
  const getValue = (prefix) => {
    const line = lines.find((l) => l.startsWith(prefix))
    return line ? line.slice(prefix.length).trim() : ''
  }

  const slug = getValue('Slug:')
  const title = getValue('Title:')
  const description = getValue('Description:')
  const timeWindow = getValue('Time window:')
  const durationBand = getValue('Duration band:')

  const allowlistStart = lines.findIndex((l) => l.startsWith('Trusted channels'))
  const templatesStart = lines.findIndex((l) => l.startsWith('Search templates'))

  const allowlist = []
  if (allowlistStart !== -1) {
    for (let i = allowlistStart + 1; i < lines.length; i += 1) {
      const line = lines[i].trim()
      if (!line.startsWith('- ')) break
      allowlist.push(line.replace('- ', '').trim())
    }
  }

  const templates = []
  if (templatesStart !== -1) {
    for (let i = templatesStart + 1; i < lines.length; i += 1) {
      const line = lines[i].trim()
      if (!line.startsWith('- ')) break
      templates.push(line.replace('- ', '').trim())
    }
  }

  return {
    slug,
    title,
    description,
    timeWindow,
    durationBand,
    allowlist,
    templates,
  }
}

function parseDurationBand(durationBand) {
  const match = durationBand.match(/(\d+)\s*-\s*(\d+)\s*minutes?/i)
  if (!match) return { minSeconds: 0, maxSeconds: Number.POSITIVE_INFINITY }
  const min = Number(match[1])
  const max = Number(match[2])
  return { minSeconds: min * 60, maxSeconds: max * 60 }
}

function parseTimeWindow(timeWindow) {
  if (!timeWindow || timeWindow.toLowerCase() === 'no limit') {
    return { publishedAfter: null, publishedBefore: null, isRecent: false }
  }

  const lastMatch = timeWindow.match(/last\s+(\d+)\s+years?/i)
  if (lastMatch) {
    const years = Number(lastMatch[1])
    const now = new Date()
    const after = new Date(now)
    after.setFullYear(after.getFullYear() - years)
    return { publishedAfter: after.toISOString(), publishedBefore: null, isRecent: years <= 6 }
  }

  const rangeMatch = timeWindow.match(/(\d{4})\s*-\s*(\d{4})/)
  if (rangeMatch) {
    const startYear = Number(rangeMatch[1])
    const endYear = Number(rangeMatch[2])
    const after = new Date(Date.UTC(startYear, 0, 1)).toISOString()
    const before = new Date(Date.UTC(endYear + 1, 0, 1)).toISOString()
    return { publishedAfter: after, publishedBefore: before, isRecent: false }
  }

  return { publishedAfter: null, publishedBefore: null, isRecent: false }
}

function parseIsoDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  return hours * 3600 + minutes * 60 + seconds
}

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function relevanceScore(title, description, channelDescription) {
  const tokens = new Set(tokenize(channelDescription))
  if (tokens.size === 0) return 0.5
  const haystack = new Set(tokenize(`${title} ${description}`))
  let hits = 0
  tokens.forEach((token) => {
    if (haystack.has(token)) hits += 1
  })
  return Math.min(1, hits / tokens.size)
}

function recencyScore(publishedAt, timeWindow) {
  if (!timeWindow.isRecent || !publishedAt) return 0.5
  const published = new Date(publishedAt)
  const now = new Date()
  const days = Math.max(0, (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24))
  const windowDays = 365 * 6
  return Math.max(0, 1 - days / windowDays)
}

function runtimeScore(durationSeconds, durationBand) {
  const { minSeconds, maxSeconds } = durationBand
  if (durationSeconds < minSeconds || durationSeconds > maxSeconds) return 0
  const mid = (minSeconds + maxSeconds) / 2
  const span = (maxSeconds - minSeconds) / 2
  if (span === 0) return 1
  return Math.max(0, 1 - Math.abs(durationSeconds - mid) / span)
}

async function youtubeFetch(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`)
  Object.entries({ ...params, key: API_KEY }).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    url.searchParams.set(key, String(value))
  })

  const response = await fetch(url.toString())
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`YouTube API error: ${response.status} ${body}`)
  }
  return response.json()
}

async function resolveChannelIds(allowlist) {
  const results = []
  for (const name of allowlist) {
    const data = await youtubeFetch('search', {
      part: 'snippet',
      type: 'channel',
      q: name,
      maxResults: 1,
    })
    const item = data.items?.[0]
    if (item?.id?.channelId) {
      results.push({ name, channelId: item.id.channelId })
    }
  }
  return results
}

function buildQueries(templates) {
  return templates
    .map((template) => template.replace('+ channel:{allowlist}', '').trim())
    .slice(0, MAX_QUERIES)
}

async function harvestVideos(channelIds, queries, timeWindow) {
  const videoIds = new Set()
  for (const channel of channelIds) {
    for (const query of queries) {
      const data = await youtubeFetch('search', {
        part: 'snippet',
        type: 'video',
        channelId: channel.channelId,
        q: query,
        maxResults: 10,
        order: 'relevance',
        videoEmbeddable: 'true',
        safeSearch: 'moderate',
        publishedAfter: timeWindow.publishedAfter,
        publishedBefore: timeWindow.publishedBefore,
      })
      for (const item of data.items || []) {
        if (item?.id?.videoId) videoIds.add(item.id.videoId)
      }
    }
  }
  return Array.from(videoIds)
}

async function fetchVideoDetails(videoIds) {
  const results = []
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50)
    const data = await youtubeFetch('videos', {
      part: 'snippet,contentDetails',
      id: chunk.join(','),
      maxResults: 50,
    })
    results.push(...(data.items || []))
  }
  return results
}

function scoreVideos(videos, plan, channelIds, durationBand, timeWindow) {
  const allowlistSet = new Set(channelIds.map((c) => c.channelId))
  return videos.map((video) => {
    const durationSeconds = parseIsoDuration(video.contentDetails?.duration || 'PT0S')
    const trust = allowlistSet.has(video.snippet?.channelId) ? 1 : 0
    const relevance = relevanceScore(video.snippet?.title, video.snippet?.description, plan.description)
    const recency = recencyScore(video.snippet?.publishedAt, timeWindow)
    const runtime = runtimeScore(durationSeconds, durationBand)
    const score = (trust * 0.4) + (relevance * 0.25) + (recency * 0.2) + (runtime * 0.1)
    return {
      video,
      durationSeconds,
      score,
      trust,
      relevance,
      recency,
      runtime,
    }
  })
}

function orderVideos(scored) {
  const sorted = [...scored].sort((a, b) => b.score - a.score)
  const output = []
  const lastChannelIds = []

  for (const item of sorted) {
    const channelId = item.video.snippet?.channelId
    const lastChannel = lastChannelIds[lastChannelIds.length - 1]
    if (channelId && channelId === lastChannel) continue
    output.push(item)
    lastChannelIds.push(channelId)
  }

  for (const item of sorted) {
    if (!output.includes(item)) output.push(item)
  }

  return output
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

async function processPlan(planPath) {
  const planContent = fs.readFileSync(planPath, 'utf8')
  const plan = parsePlan(planContent)
  if (!plan.slug) return

  const schedulePath = path.join(CHANNELS_DIR, plan.slug, 'schedule.json')
  if (fs.existsSync(schedulePath)) {
    console.log(`Skipping ${plan.slug}: schedule.json already exists.`)
    return
  }

  const durationBand = parseDurationBand(plan.durationBand)
  const timeWindow = parseTimeWindow(plan.timeWindow)

  const allowlist = plan.allowlist.slice(0, MAX_ALLOWLIST)
  const channelIds = await resolveChannelIds(allowlist)
  const queries = buildQueries(plan.templates)
  const candidateIds = await harvestVideos(channelIds, queries, timeWindow)
  const videos = await fetchVideoDetails(candidateIds)

  const filtered = videos.filter((video) => {
    const durationSeconds = parseIsoDuration(video.contentDetails?.duration || 'PT0S')
    const withinDuration = durationSeconds >= durationBand.minSeconds && durationSeconds <= durationBand.maxSeconds
    return withinDuration
  })

  const scored = scoreVideos(filtered, plan, channelIds, durationBand, timeWindow)
  const ordered = orderVideos(scored)

  const seed = {
    channel: {
      slug: plan.slug,
      title: plan.title,
      description: plan.description,
    },
    criteria: {
      timeWindow: plan.timeWindow,
      durationBand: plan.durationBand,
      allowlist: channelIds,
      templates: plan.templates,
      scoringWeights: {
        trust: 0.4,
        relevance: 0.25,
        recency: 0.2,
        runtime: 0.1,
        variety: 0.05,
      },
    },
    run: {
      timestamp: new Date().toISOString(),
      candidateCount: candidateIds.length,
      filteredCount: filtered.length,
      finalCount: ordered.length,
    },
  }

  const schedule = ordered.map((item, index) => ({
    position: index,
    youtube_video_id: item.video.id,
    title: item.video.snippet?.title || null,
    duration_seconds: item.durationSeconds,
    youtube_channel_id: item.video.snippet?.channelId || null,
    youtube_channel_name: item.video.snippet?.channelTitle || null,
    thumbnail_url: item.video.snippet?.thumbnails?.high?.url || item.video.snippet?.thumbnails?.default?.url || null,
    published_at: item.video.snippet?.publishedAt || null,
    score: Number(item.score.toFixed(4)),
  }))

  const basePath = path.join(CHANNELS_DIR, plan.slug)
  writeJson(path.join(basePath, 'seed.json'), seed)
  writeJson(path.join(basePath, 'schedule.json'), schedule)
}

async function run() {
  const plans = listChannelPlans()
  for (const planPath of plans) {
    console.log(`Processing ${planPath}`)
    await processPlan(planPath)
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
