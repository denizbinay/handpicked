# Seed Research Plan (Iterative)

This folder contains the channel-by-channel research plans used to generate
trusted YouTube schedules without human review. The process is intentionally
iterative to avoid context overload. Each channel is handled fully before moving
to the next.

## Pipeline (one channel per cycle)
1. Load channel + curator profile (from Supabase tables: channels, creator_profiles)
2. Create trusted creator allowlist for the topic
3. Generate search templates (YouTube API queries)
4. Harvest candidates (YouTube Data API) restricted to allowlist
5. Filter (duration band, publish window, language, embeddable)
6. Score + order
7. Write outputs immediately:
   - data/seed/channels/<slug>/seed.json
   - data/seed/channels/<slug>/schedule.json

## Scoring (shared)
- Trustworthiness (40%)
- Relevance to channel description (25%)
- Recency (20%) when category is time-sensitive
- Runtime fit (10%)
- Variety (5%) to avoid same creator back-to-back

## Ordering (shared)
- Sort by score, then enforce creator diversity (no identical creator consecutively)
- Ensure minimum spacing between same creator (>= 1 item)
- Keep chronological order only when channel theme demands it
