# CLAUDE.md

## Project Overview

**Handpicked** is a lean-back, TV-like web experience built from curated YouTube videos.

The core idea is to recreate the feeling of linear television:
- you turn it on
- something is already playing
- you can change channels, but you cannot control the content within a channel

This project intentionally avoids algorithmic recommendations, feeds, and interactive controls.

---

## Product Principles (Authoritative)

These principles override all other considerations.

1. **Lean-back over choice**
   - The product should reduce decisions, not add them.
   - Autoplay is mandatory.
   - The user should never be required to choose a video.

2. **Channels, not videos**
   - Users interact with channels, not individual videos.
   - Videos are an implementation detail.

3. **No content navigation controls**
   - No skipping
   - No scrubbing
   - No selecting the next video
   - The only allowed content action is switching channels
   - Allowed controls: mute/unmute, volume, quality, fullscreen, pause/resume (resume re-syncs to live)

4. **Human curation only**
   - No algorithmic ordering
   - No personalization
   - No “recommended for you”
   - All structure is defined by curators or fixed rules

5. **Nerd-first dark UI**
   - Dark-first visual language
   - Modern, tool-oriented aesthetic for technical users
   - Avoid Netflix / YouTube grids and thumbnail-driven layouts
   - Prefer rows and lists over cards
   - UI should feel like a focused media tool, not a browsing catalog

---

## Rule Enforcement & Change Escalation

This project is governed by multiple **sources of truth** documents.

Before implementing any change, the AI must compare the requested change against **all relevant authoritative documents** listed in the *Source of Truth* section below.

### Decision Process

1. If the change is compatible with all applicable sources of truth:
   - Proceed with implementation.

2. If the change contradicts any existing rule, constraint, or specification:
   - Do NOT implement the change.
   - Explicitly identify which document(s) are being contradicted and how.
   - Ask the user whether the relevant document(s) should be updated.

Only after the authoritative document(s) are intentionally modified may changes that depend on the new rules be implemented.

This mechanism exists to prevent silent drift, preserve architectural intent, and ensure that all rule changes are explicit and deliberate.

---

## What This Project Is NOT

This project must NOT become:

- A YouTube client
- A recommendation engine
- A social platform
- A feed-based product
- An interactive video player
- A productivity or learning tool

If a feature pushes the product in one of these directions, it should be rejected by default.

---

## Technical Scope (Initial)

- Frontend: Nuxt 3 / Vue 3
- Video playback via YouTube IFrame API
- Backend: Supabase (used minimally)
- Authentication: only for curators (not viewers)
- Viewers do not need accounts

Avoid premature optimization, scaling assumptions, or complex infrastructure.

---

## Technical Gotchas

### Supabase Auth: Avoid `useSupabaseUser()` for User ID

**Problem:** The `useSupabaseUser()` composable from `@nuxtjs/supabase` returns a ref that may not be hydrated immediately after page navigation. This causes `user.value.id` to be `undefined` even when the user is authenticated.

**Symptom:** RLS policy errors like "new row violates row-level security policy" or ownership checks failing immediately after redirect.

**Solution:** Always use `supabase.auth.getSession()` to get the user ID reliably:

```typescript
// BAD - may be undefined after navigation
const user = useSupabaseUser()
const userId = user.value?.id  // can be undefined!

// GOOD - always returns current session
const { data: sessionData } = await supabase.auth.getSession()
const userId = sessionData.session?.user?.id
```

This applies to any code that runs immediately after page load or navigation, especially in curator pages.

---

## Working Style & Rules for AI Assistance

When working on this project, the AI must follow these rules:

1. **Small, explicit steps**
   - Prefer incremental changes
   - Avoid large refactors unless explicitly requested

2. **Specs before implementation**
   - If behavior is unclear, update or consult files in `specs/`
   - Do not invent product behavior without documenting it first

3. **No silent assumptions**
   - If something is ambiguous, ask or leave it open
   - Do not “fill in the gaps” creatively

4. **Respect existing files**
   - Do not rewrite files wholesale unless instructed
   - Modify only what is relevant to the current task

5. **Prototype mindset**
   - This is an exploratory project
   - It is acceptable to build temporary or throwaway code
   - Clarity and learning are more important than polish

---

## Source of Truth

- Product intent: `specs/product.md`
- Player behavior: `specs/player.md`
- Data model: `specs/database.md`
- Current focus and state: `PROGRESS.md`

If these files are empty or incomplete, that is intentional and should be addressed gradually.

---

## Final Note

When in doubt, prefer:
- simpler behavior over richer behavior
- fewer controls over more controls
- clarity over cleverness

The goal is not to build a powerful app, but a *specific experience*.
