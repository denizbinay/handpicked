# Admin Interface Implementation Plan

## Overview

Build an admin interface for Handpicked that allows superuser curators to manage the platform. Admins are curators with elevated privileges, manually upgraded by existing admins.

**First admin**: denizbinay (id: `2bd62a5c-fbf7-4f83-b487-8f9bedded945`)

---

## Admin Capabilities

1. **System health & stats** - Dashboard with platform metrics
2. **See ALL channels** - Including private ones
3. **Edit any channel** - Timelines, videos, public/private status (impersonate with edit rights)
4. **Delete videos** - From any channel schedule
5. **Manage highlight channels** - Control which channels appear in sidebar highlights

---

## Implementation Phases

### Phase 1: Database Schema

**New table: `admin_users`**
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES creator_accounts(id),
  granted_by UUID REFERENCES admin_users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT first_admin_bootstrap CHECK (
    id = '2bd62a5c-fbf7-4f83-b487-8f9bedded945' OR granted_by IS NOT NULL
  )
);

-- RLS: Admins can read admin_users, only admins can insert
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check if user is admin" ON admin_users
  FOR SELECT USING (true);

CREATE POLICY "Admins can grant admin" ON admin_users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );
```

**New table: `highlight_channels`**
```sql
CREATE TABLE highlight_channels (
  channel_id UUID PRIMARY KEY REFERENCES channels(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_by UUID REFERENCES admin_users(id),
  added_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE highlight_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read highlights" ON highlight_channels
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage highlights" ON highlight_channels
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );
```

**Update RLS policies for admin access:**
```sql
-- Channels: Admins can read/update all
CREATE POLICY "Admins can read all channels" ON channels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update all channels" ON channels
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Channel schedules: Admins can manage all
CREATE POLICY "Admins can manage all schedules" ON channel_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Channel timelines: Admins can manage all
CREATE POLICY "Admins can manage all timelines" ON channel_timelines
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );
```

**Bootstrap first admin:**
```sql
INSERT INTO admin_users (id, granted_by)
VALUES ('2bd62a5c-fbf7-4f83-b487-8f9bedded945', NULL);
```

---

### Phase 2: Admin Auth Composable

**File:** `app/composables/useAdmin.ts`

```typescript
export function useAdmin() {
  const supabase = useSupabaseClient()
  const isAdmin = ref(false)
  const isChecking = ref(true)

  async function checkAdmin(): Promise<boolean> {
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user?.id) return false

    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', session.session.user.id)
      .single()

    return !!data
  }

  async function initialize() {
    isChecking.value = true
    isAdmin.value = await checkAdmin()
    isChecking.value = false
  }

  return { isAdmin, isChecking, checkAdmin, initialize }
}
```

---

### Phase 3: Admin Middleware

**File:** `app/middleware/admin-auth.ts`

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()

  // Check session
  const { data: session } = await supabase.auth.getSession()
  if (!session.session?.user?.id) {
    return navigateTo('/curator/login')
  }

  // Check admin status
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', session.session.user.id)
    .single()

  if (!adminData) {
    return navigateTo('/curator') // Not an admin, go to regular curator
  }
})
```

---

### Phase 4: Admin Pages

#### 4.1 Admin Dashboard
**File:** `app/pages/admin/index.vue`

- System stats: total channels, total videos, total curators
- Recent activity: newly created channels, recently updated
- Quick links to other admin pages

#### 4.2 All Channels List
**File:** `app/pages/admin/channels/index.vue`

- List ALL channels (public and private)
- Show: title, slug, curator, public/private, video count, category
- Filter by: public/private, category, curator
- Actions: Edit, View, Toggle Public/Private

#### 4.3 Admin Channel Editor
**File:** `app/pages/admin/channels/[id].vue`

- Reuse curator channel editor patterns
- Skip ownership check (admin can edit any)
- Additional admin controls:
  - Force public/private toggle
  - Delete entire channel
  - Reset timeline
  - Add/remove from highlights

#### 4.4 Highlight Manager
**File:** `app/pages/admin/highlights.vue`

- Show current highlight channels with drag-to-reorder
- Search/add channels to highlights
- Remove from highlights
- Set position order

#### 4.5 Curator List (future)
**File:** `app/pages/admin/curators.vue`

- List all curators
- See their channels
- Grant/revoke admin status

---

### Phase 5: Update Sidebar to Use Highlight Channels

**File:** `app/components/ChannelSidebar.vue`

Change `highlightChannels` to fetch from `highlight_channels` table instead of just taking first 6:

```typescript
const { data: highlights } = await supabase
  .from('highlight_channels')
  .select('channel_id, position, channels(*)')
  .order('position', { ascending: true })
  .limit(6)
```

Fallback to first 6 public channels if no highlights configured.

---

### Phase 6: Types Update

**File:** `app/types/database.ts`

Add:
```typescript
export interface AdminUser {
  id: string
  granted_by: string | null
  granted_at: string
}

export interface HighlightChannel {
  channel_id: string
  position: number
  added_by: string
  added_at: string
}
```

---

## File Summary

| Action | File |
|--------|------|
| Migration | `supabase/migrations/XXXXXX_add_admin_tables.sql` |
| Create | `app/composables/useAdmin.ts` |
| Create | `app/middleware/admin-auth.ts` |
| Create | `app/pages/admin/index.vue` |
| Create | `app/pages/admin/channels/index.vue` |
| Create | `app/pages/admin/channels/[id].vue` |
| Create | `app/pages/admin/highlights.vue` |
| Modify | `app/components/ChannelSidebar.vue` |
| Modify | `app/types/database.ts` |

---

## Verification Checklist

- [ ] First admin (denizbinay) can access /admin
- [ ] Non-admins redirected to /curator
- [ ] Admin dashboard shows accurate stats
- [ ] Admin can see all channels including private
- [ ] Admin can edit any channel (videos, timeline, public/private)
- [ ] Admin can delete videos from any channel
- [ ] Admin can manage highlight channels
- [ ] Sidebar shows highlight channels from database
- [ ] Admin can grant admin to another curator

---

## Security Considerations

1. **RLS policies** enforce admin checks at database level
2. **Middleware** provides client-side protection
3. **Both layers** must pass for access
4. **Admin grant chain** tracked via `granted_by` column
5. **First admin bootstrapped** with NULL granted_by (special case)
