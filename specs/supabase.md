# Supabase Usage (v0.1)

This document defines how Handpicked uses Supabase across the app.
It exists to prevent auth and session drift, not to prescribe UI behavior.

---

## Scope

- Client auth (curators/admins)
- Session handling and hydration
- Admin checks and ownership checks
- Service role usage (server only)

---

## Architecture Choice

Handpicked is a Nuxt app with SSR routes but a client-first auth flow.
Supabase auth is treated as client state; server routes use service role only where needed.

---

## Session Defaults

Use these rules consistently:

- `supabase.auth.getSession()`
  - UI display only (navbar labels, presence checks)
  - Fast, local-only, no network verification

- `supabase.auth.getUser()`
  - Required for security decisions
  - Admin checks, ownership checks, and any inserts/updates that depend on `user.id`
  - Verified by the Auth server

---

## Auth State Model

Auth must be treated as a three-state system:

- `loading`
- `authenticated`
- `unauthenticated`

Initialize auth once at app root and share it via a composable/store.
Do not create multiple `onAuthStateChange` listeners in different components.

---

## Admin Checks

- Admin access is enforced in route middleware.
- Admin checks must use `getUser()` before checking admin roles in `creator_accounts`.
- Do not trust session cookies/local storage for admin decisions.

---

## Ownership Checks

- Ownership checks must use `getUser()` and compare verified `user.id` to `created_by`.
- Do not use `getSession()` for ownership checks.

---

## SSR and Hydration

- Do not call `getSession()` in SSR data loaders for gated logic.
- Defer auth-dependent work until client hydration is complete and auth state is settled.

---

## Service Role Usage

- Service role keys are server-only.
- Never expose the service role key in client bundles.
- Use server endpoints for operations that must bypass RLS.

---

## Known Gotchas

- `useSupabaseUser()` can be undefined immediately after navigation.
  - Use `getSession()` for UI and `getUser()` for verified identity.
- Multiple `onAuthStateChange` listeners can cause session drift and inconsistent state.
- Stale session data can silently block admin route navigation.

---

## Reference Practices (Summary)

Aligned with 2025-2026 community guidance:

- Single auth listener at app root
- Verified identity via `getUser()` for security decisions
- Avoid `getSession()` for SSR-gated logic
- Keep service role usage server-only
