# Admin Users + Liquid Glass Design System

**Spec date:** 2026-05-08
**Status:** Draft — pending user review
**Owner:** lautarogarofano@gmail.com
**Scope:** Spec 1 of 2. Spec 2 (full-app visual migration) will follow.

---

## 1. Goal

Build a usable admin module to manage Mechaia users (search, view detail, block, grant messages, change plan) on top of a new Liquid Glass design system that will eventually be applied to the entire app.

This spec ships:
- A foundational design system: tokens, primitives, animated background, SVG turbulence filter — dark theme only.
- A complete Admin Users module: tabs inside the existing `AdminDashboard`, table, drawer, three actions, audit log.
- The existing `AdminStats` revestido (re-skinned) with the new primitives, so the entire admin shows the new look.

Everything else in the app (Landing, Auth, Chat, Form, Settings, Pricing) is **out of scope** and stays as-is.

## 2. Non-goals

- Conversations module (read transcripts, flag bad answers) — Spec 3.
- Growth analytics (funnel, cohorts, churn) — Spec 4.
- Anti-abuse macro views (rate-limit hits, anomalies) — Spec 5.
- Migrating Landing / Auth / Chat / Form / Settings / Pricing to Liquid Glass — Spec 2.
- Multiple admin users / role system — only `lautarogarofano@gmail.com` for now (hardcoded, same as today).
- Hard-delete or anonymize accounts (GDPR) — explicitly excluded by user.
- Light theme support — dropped in this spec.
- React Router — keep manual `useState`-based routing in `App.tsx`.

## 3. User stories

| # | As admin I want to… | So I can… |
|---|---|---|
| U1 | Open the admin and switch between Stats and Users with one click | Use one screen for both monitoring and operations |
| U2 | Search any user by email or workshop name | Find them in seconds during support |
| U3 | See at a glance: who they are, plan/status, activity, consumption, signup date | Triage without opening the detail |
| U4 | Click a row and see the full detail in a side drawer without losing the list | Process several users in a row |
| U5 | Block / unblock a user from the drawer | Cut access to abusive accounts and restore later |
| U6 | Grant extra messages or extend trial | Help in support cases or run promos |
| U7 | Change a user's plan manually | Comp testers, refunds, complimentary upgrades |
| U8 | See a log of the last admin actions on a user | Have traceability without relying on memory |

## 4. Architecture

### 4.1 High-level

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminTabs.tsx          (toggle Stats / Users — useState, no router)
│   │   ├── AdminStats.tsx         (existing stats extracted from AdminDashboard, restyled with glass primitives)
│   │   ├── AdminUsers.tsx         (search input + UsersTable)
│   │   ├── UsersTable.tsx
│   │   ├── UserDrawer.tsx         (detail + actions + audit log)
│   │   └── actions/
│   │       ├── BlockAction.tsx
│   │       ├── GrantMessagesAction.tsx
│   │       └── ChangePlanAction.tsx
│   ├── glass/
│   │   ├── GlassCard.tsx
│   │   ├── GlassPanel.tsx
│   │   ├── GlassButton.tsx
│   │   ├── GlassTable.tsx
│   │   ├── GlassBadge.tsx
│   │   ├── LiquidBackground.tsx
│   │   └── TurbulenceFilter.tsx   (SVG <defs> mounted once at App root)
│   └── AdminDashboard.tsx         (refactored: header + tabs + LiquidBackground)
├── lib/
│   └── adminApi.ts                (typed client for /api/admin/* endpoints)
└── types/
    └── admin.ts                   (AdminUserRow, AdminUserDetail, AdminAction, etc.)

api/
└── admin/
    ├── users.ts                   (GET list)
    ├── user-detail.ts             (GET by id)
    ├── user-action.ts             (POST action)
    └── audit-log.ts               (GET, optional but cheap to include)

supabase/
└── admin_users.sql                (admin_actions table + 5 SECURITY DEFINER RPCs)
```

### 4.2 Routing within admin

`AdminDashboard` already toggles in/out via `useState` in `App.tsx`. Inside the dashboard, a second `useState<'stats' | 'users'>('stats')` drives the tabs. No router added.

### 4.3 Data flow per action

```
UserDrawer button click
  → confirmation inline ("Confirmar / Cancelar")
  → POST /api/admin/users/:id/action  { action, payload }  (Bearer token of admin)
  → endpoint creates Supabase client with caller token
  → endpoint calls SECURITY DEFINER RPC (e.g., admin_block_user)
  → RPC verifies auth.email() === 'lautarogarofano@gmail.com', or raises 'Acceso denegado'
  → RPC mutates target (auth.users.banned_until / subscriptions / etc.)
  → RPC inserts row in admin_actions
  → endpoint returns updated user detail
  → UserDrawer optimistically refreshes its local state with the response
```

## 5. Design system: Liquid Glass

### 5.1 Constraints

- **Dark theme only.** No `dark:` prefixes needed in the new components.
- **Performance budget:** the admin must stay smooth on a mid-range laptop. SVG turbulence + animations are GPU-heavy; we restrict their use.
- **Accessibility:** respect `prefers-reduced-motion` (kill blob animation + turbulence animate). Maintain WCAG AA contrast for all text.

### 5.2 Tokens (added to `tailwind.config.js`)

```js
extend: {
  colors: {
    'glass-bg':        'rgba(255,255,255,0.05)',
    'glass-elevated':  'rgba(255,255,255,0.10)',
    'glass-border':    'rgba(255,255,255,0.10)',
    'glass-border-strong': 'rgba(255,255,255,0.20)',
    'glass-text':      'rgba(255,255,255,1)',
    'glass-text-mute': 'rgba(255,255,255,0.70)',
    'glass-text-dim':  'rgba(255,255,255,0.40)',
    'accent-violet':   '#a78bfa',
    'accent-cyan':     '#22d3ee',
    'accent-pink':     '#f472b6',
  },
  boxShadow: {
    'glass':       '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)',
    'glass-strong':'0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
  },
  backdropBlur: { 'xl': '20px' },
  animation: {
    'blob-1': 'blob1 22s ease-in-out infinite',
    'blob-2': 'blob2 28s ease-in-out infinite',
    'blob-3': 'blob3 24s ease-in-out infinite',
  },
  keyframes: { /* blob1/2/3 — translate + scale loops, defined inline in this section */ },
}
```

Body base: `bg-slate-950 text-glass-text antialiased`.

### 5.3 `<LiquidBackground />`

Mounted once inside `AdminDashboard`, behind everything else with `pointer-events-none`.

```tsx
<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
  <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent-violet/40 blur-3xl animate-blob-1 motion-reduce:animate-none" />
  <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-accent-cyan/35 blur-3xl animate-blob-2 motion-reduce:animate-none" />
  <div className="absolute -bottom-40 left-1/4 w-[550px] h-[550px] rounded-full bg-accent-pink/30 blur-3xl animate-blob-3 motion-reduce:animate-none" />
  <div className="absolute inset-0 bg-gradient-radial from-transparent to-slate-950/80" /> {/* vignette */}
</div>
```

### 5.4 `<TurbulenceFilter />`

Mounted ONCE at `<App>` root in a hidden `<svg>` so the filter id can be referenced from anywhere.

```tsx
<svg className="absolute w-0 h-0" aria-hidden>
  <defs>
    <filter id="liquid-glass">
      <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="turb">
        <animate attributeName="baseFrequency" dur="14s" values="0.012;0.018;0.012" repeatCount="indefinite" />
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="turb" scale="18" />
    </filter>
  </defs>
</svg>
```

Applied via `style={{ filter: 'url(#liquid-glass)' }}` only on `<GlassPanel liquid>`.

### 5.5 Primitives

| Component | Default classes | Liquid distortion |
|---|---|---|
| `<GlassCard>` | `bg-glass-bg backdrop-blur-xl border border-glass-border rounded-2xl shadow-glass` | `liquid` prop, off by default |
| `<GlassPanel>` | `bg-glass-elevated backdrop-blur-xl border border-glass-border-strong rounded-3xl shadow-glass-strong` | `liquid` prop, **on** by default |
| `<GlassButton>` | `bg-glass-bg hover:bg-glass-elevated border border-glass-border rounded-xl px-4 py-2 transition-colors` + variant prop (`primary` violet, `danger` red, `ghost`) | Never |
| `<GlassTable>` | wrapper `<table>` with sticky header, divide rows by `border-glass-border`, hover `bg-glass-elevated/50` | Never |
| `<GlassBadge>` | rounded-full, color by status (trial=violet/20, base=green/20, turbo=cyan/20, blocked=red/20, inactive=white/10) | Never |

### 5.6 Performance rules

- `liquid` (SVG turbulence + animation) **only** on: header of admin, opened drawer, decorative areas of `LiquidBackground`. NEVER on table rows, buttons, badges.
- `backdrop-blur` ceiling: `xl` (20px). No `2xl`/`3xl`.
- `will-change: transform` only on the three blobs.
- Wrap heavy decorative SVG/turbulence in a single instance per route (not per component instance).
- Honour `prefers-reduced-motion: reduce` → `motion-reduce:animate-none` on blobs; turbulence `<animate>` short-circuited via media query (CSS `@media (prefers-reduced-motion: reduce) { .liquid-target { filter: none !important; } }`).

## 6. Data model

### 6.1 New table: `admin_actions`

```sql
create table admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action text not null check (action in ('block','unblock','grant_messages','extend_trial','change_plan')),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index admin_actions_target_idx on admin_actions(target_user_id, created_at desc);

alter table admin_actions enable row level security;

-- Only the hardcoded admin can read; nobody can write directly (writes go through SECURITY DEFINER RPCs)
create policy admin_actions_read on admin_actions
  for select
  using ((select email from auth.users where id = auth.uid()) = 'lautarogarofano@gmail.com');
```

### 6.2 Reuse of existing tables

- `auth.users` — identity, signup date, `banned_until` for block/unblock.
- `subscriptions` — plan, status, messages_used, messages_limit, trial_diagnostics_remaining.
- `diagnostics` — counts and last activity.

**No schema changes** to existing tables.

### 6.3 RPCs (`SECURITY DEFINER`, single file `supabase/admin_users.sql`)

All RPCs start with the same admin guard:
```sql
declare v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null or v_email <> 'lautarogarofano@gmail.com' then
    raise exception 'Acceso denegado';
  end if;
  -- ...
end;
```

| RPC | Args | Returns |
|---|---|---|
| `admin_list_users(p_search text)` | search string (matches email or workshop_name, case-insensitive, `ilike`) | `jsonb` array of rows: `{id, email, workshop_name, plan, status, banned_until, messages_used, messages_limit, trial_diagnostics_remaining, diagnostics_count, last_diagnostic_at, created_at}`. Sort by `created_at desc`. Hard-cap 200 rows per query. |
| `admin_user_detail(p_target uuid)` | user id | `jsonb` `{user, subscription, recent_diagnostics: [last 20], recent_actions: [last 10]}` |
| `admin_block_user(p_target uuid, p_block boolean)` | user id, block?true/false | `jsonb` updated user detail. Sets `auth.users.banned_until = 'infinity'` or `null` via `update auth.users`. Valid because the RPC runs as `SECURITY DEFINER` (owner = postgres), which has write access to the `auth` schema. Inserts admin_actions with action `block`/`unblock`. |
| `admin_grant_messages(p_target uuid, p_qty int)` | user id, qty (positive int 1–500) | updated detail. If subscription.status='trial' → increments `trial_diagnostics_remaining`. Else → decrements `messages_used` (clamped at 0). Inserts log with action `grant_messages` or `extend_trial`. |
| `admin_change_plan(p_target uuid, p_plan text, p_status text)` | user id, plan in ('base','turbo'), status in ('trial','active','inactive','cancelled') | updated detail. Upserts `subscriptions` (insert if missing). For plan='turbo' → `messages_limit=null`; for 'base' → `messages_limit=150`. Inserts log. |

Validation: each RPC validates its own inputs and raises with a Spanish-language error string (e.g. `'Plan inválido'`, `'Cantidad fuera de rango'`).

## 7. Backend API

All under `api/admin/`. Same auth pattern as existing `api/admin-stats.ts`: Bearer token of caller, Supabase client with that token, RPC verifies internally.

### `GET /api/admin/users?search=`
- Query param `search` optional, max 100 chars.
- Returns `{ users: AdminUserRow[] }`.
- Status: 200 OK | 401 if no token | 403 if not admin | 500 on RPC error.

### `GET /api/admin/users/:id`
- `:id` is a UUID (validate format, else 400).
- Returns `AdminUserDetail`.
- 404 if user not found.

### `POST /api/admin/users/:id/action`
- Body Zod-validated:
```ts
const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('block') }),
  z.object({ action: z.literal('unblock') }),
  z.object({ action: z.literal('grant_messages'), qty: z.number().int().min(1).max(500) }),
  z.object({ action: z.literal('change_plan'),
             plan: z.enum(['base','turbo']),
             status: z.enum(['trial','active','inactive','cancelled']) }),
]);
```
- Maps to the corresponding RPC, returns updated detail.
- 400 on invalid body, 403 on permission, 422 on RPC business error (e.g. invalid plan).

### `GET /api/admin/audit-log?target=&limit=`
- Optional. Returns last N admin_actions (default 50, max 200), optionally filtered by `target`.

**Rate limiting:** reuse the `rate_limits` table pattern with a per-admin-IP bucket (60 req/min). Block lists are not relevant for a single-admin scenario but cheap to add.

## 8. Frontend

### 8.1 `AdminDashboard.tsx` (refactored, ~150 lines after refactor)

```tsx
<div className="min-h-screen bg-slate-950">
  <LiquidBackground />
  <div className="relative max-w-6xl mx-auto px-4 py-8">
    <Header user={user} onBack={onBack} />
    <AdminTabs value={tab} onChange={setTab} />
    {tab === 'stats' ? <AdminStats /> : <AdminUsers />}
  </div>
</div>
```

`<TurbulenceFilter />` is mounted in `App.tsx` (top-level once).

### 8.2 `AdminTabs.tsx`

Two pill buttons (`<GlassButton>` ghost variant), the active one gets `bg-glass-elevated border-glass-border-strong text-white`, the other `text-glass-text-mute`. Smooth `transition`.

### 8.3 `AdminStats.tsx` (extracted from current `AdminDashboard.tsx`)

Same logic and data, but the `StatCard` helper is replaced by `<GlassCard>`. Section headings use `text-glass-text-mute` instead of `text-slate-500`.

### 8.4 `AdminUsers.tsx`

```tsx
<div className="space-y-4">
  <SearchInput value={search} onChange={setSearch} placeholder="Buscar por email o taller…" />
  <UsersTable rows={rows} loading={loading} error={error} onRowClick={setSelectedId} />
  {selectedId && <UserDrawer userId={selectedId} onClose={() => setSelectedId(null)} onChanged={refresh} />}
</div>
```

Search input is a `<GlassCard>` with a left lupa icon and an input that sits transparent inside. Debounce 300ms before calling `/api/admin/users?search=`.

### 8.5 `UsersTable.tsx`

`<GlassTable>` columns:

| Column | Render |
|---|---|
| Usuario | Avatar (initial of workshop or email) + email + workshop_name (small) |
| Plan / Estado | Two stacked `<GlassBadge>`: plan (base/turbo) + status (trial/active/blocked/inactive). If `banned_until` set → status badge becomes "Bloqueado" red. |
| Diagnósticos | `9` big + `hace 3 días` small (relative time, computed from `last_diagnostic_at`) |
| Consumo | `47/150` for base; `312/∞` for turbo; `3/5 trial` for trial |
| Signup | `20 mar` (date-fns `format` `dd MMM`, locale es) |

Loading state: 10 skeleton rows (animated `<GlassCard>`s). Empty state: "Sin resultados". Error state: red text inside a `<GlassCard>`.

### 8.6 `UserDrawer.tsx`

```tsx
<div className="fixed inset-0 z-50">
  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
  <GlassPanel liquid className="absolute right-0 top-0 h-full w-full sm:w-[480px] overflow-y-auto p-6 animate-slide-in-right">
    <Header user={detail.user} onClose={onClose} />
    <SubscriptionSection sub={detail.subscription} />
    <ActionsSection user={detail.user} sub={detail.subscription} onChanged={refetch} />
    <RecentDiagnosticsSection items={detail.recent_diagnostics} />
    <AuditLogSection items={detail.recent_actions} />
  </GlassPanel>
</div>
```

Closes on: backdrop click, ESC key, ✕ button.
Slide-in: Tailwind keyframe (`translate-x-full → translate-x-0`, 250ms ease-out).

### 8.7 Action components (`actions/*`)

Each action is a `<GlassButton>` that, when clicked, swaps in-place into a confirmation row (Confirmar / Cancelar) plus required inputs. No modal — keeps it inside the drawer.

- `BlockAction`: button "Bloquear" (red) or "Desbloquear" (violet) depending on `banned_until`. On confirm → POST action.
- `GrantMessagesAction`: button "Regalar mensajes" → reveals number input (default 10) + Confirmar. Server caps 1–500.
- `ChangePlanAction`: button "Cambiar plan" → reveals plan select (base/turbo) + status select (trial/active/inactive/cancelled) + Confirmar.

After any action: optimistic loading state on the button, then refresh drawer and table row.

### 8.8 `lib/adminApi.ts`

Typed wrappers:
```ts
listUsers(search?: string): Promise<AdminUserRow[]>
getUserDetail(id: string): Promise<AdminUserDetail>
runAction(id: string, body: AdminActionBody): Promise<AdminUserDetail>
getAuditLog(target?: string, limit?: number): Promise<AdminActionRow[]>
```

Each adds the `Authorization: Bearer <session.access_token>` header internally and parses errors uniformly.

### 8.9 Types (`types/admin.ts`)

```ts
export type SubscriptionStatus = 'trial' | 'active' | 'inactive' | 'cancelled' | 'past_due';
export type Plan = 'base' | 'turbo';

export interface AdminUserRow {
  id: string;
  email: string;
  workshop_name: string | null;
  plan: Plan | null;
  status: SubscriptionStatus | null;
  banned_until: string | null;
  messages_used: number;
  messages_limit: number | null;
  trial_diagnostics_remaining: number;
  diagnostics_count: number;
  last_diagnostic_at: string | null;
  created_at: string;
}

export interface AdminUserDetail {
  user: { id: string; email: string; workshop_name: string | null; banned_until: string | null; created_at: string };
  subscription: { /* full row */ } | null;
  recent_diagnostics: Array<{ id: string; patente: string; falla: string; created_at: string; status: string }>;
  recent_actions: Array<{ id: string; actor_email: string; action: string; payload: unknown; created_at: string }>;
}

export type AdminActionBody =
  | { action: 'block' }
  | { action: 'unblock' }
  | { action: 'grant_messages'; qty: number }
  | { action: 'change_plan'; plan: Plan; status: SubscriptionStatus };
```

## 9. Security

- Admin email is enforced in **two layers**: `VITE_ADMIN_EMAIL` env var (frontend gating, UX-only — hides the admin button) and a literal `'lautarogarofano@gmail.com'` string inside each `SECURITY DEFINER` RPC (backend gating, authoritative). Frontend gate is decorative and can be bypassed; the RPC gate is the real enforcement and cannot be bypassed without DB access.
- Service role key NEVER reaches the client. All mutations go via RPCs; the API endpoints only forward the caller's Bearer token.
- All bodies validated with Zod. Sizes capped (search 100 chars, qty 1–500).
- Rate limit on admin endpoints: 60 req/min per IP via existing `rate_limits` table.
- `admin_actions` table has RLS read for admin only. Inserts only via `SECURITY DEFINER` RPCs.
- Block uses `auth.users.banned_until` (Supabase native). Setting `'infinity'` denies refresh tokens and login.

## 10. Performance budget

- First paint of `AdminDashboard` ≤ 300ms after data resolves on a mid-range laptop (lighthouse local audit).
- Table renders 200 rows without dropped frames on scroll.
- Drawer slide-in animation runs at 60fps.
- Liquid background animates without taxing CPU > 5% at idle.
- `prefers-reduced-motion` honoured: blobs static, turbulence frozen.

## 11. Error handling

- All API errors surface as `{ error: string }` with appropriate HTTP status.
- Frontend shows a `<GlassCard>` with red text for any failed fetch.
- RPC validation errors (e.g. invalid plan) return 422; frontend shows the Spanish message inline next to the action.
- Missing user (404) closes the drawer and refreshes the table.

## 12. Testing strategy

Manual + scripted:

1. **DB layer:** SQL queries against staging Supabase to verify each RPC returns expected shape, denies non-admin caller, and inserts the audit row.
2. **API layer:** `curl` with admin token (success) and a non-admin token (403). Validate Zod rejects bad bodies.
3. **UI layer:** `playwright-cli` flows:
   - Open admin → switch tab → Users renders.
   - Type search → debounced fetch → row count changes.
   - Click row → drawer opens with detail.
   - Block → confirm → status badge becomes "Bloqueado" → unblock → restored.
   - Grant messages 5 → confirm → counter updates.
   - Change plan to turbo → confirm → plan badge updates.
   - Audit log shows the latest entry first.
4. **Visual:** open the admin in Chrome, verify liquid background animates, glass cards have correct blur, drawer slide-in is smooth, no jank.

## 13. Migration / rollout

- All changes are additive (new files, new columns are zero — only one new table). Zero downtime.
- After deploying: run `supabase/admin_users.sql` in production via Supabase SQL editor.
- Frontend deploy goes via Vercel as usual. Existing admin link in App.tsx keeps working.
- If the redesign causes any visual regression in the existing `AdminStats`, easy rollback: revert the AdminDashboard refactor commit (keeps stats logic intact since it was extracted, not rewritten).

## 14. Open questions resolved during brainstorm

| Question | Decision |
|---|---|
| Scope across the 4 admin purposes (support / ops / growth / quality)? | Spec 1 = Users only. Modules 2–4 deferred. |
| Detail layout: drawer / modal / page? | Drawer (no router, fast triage). |
| Search complexity? | Free search by email/workshop only. No filter chips. |
| Block mechanism: native Auth or custom flag? | Native `banned_until`. |
| Multiple admins? | Single hardcoded email. |
| Audit log? | Yes, simple `admin_actions` table. |
| Visual scope? | Whole app eventually (Spec 2). This Spec 1: admin only as pilot. |
| Liquid intensity? | Full liquid (SVG turbulence + animation), with perf carve-outs (only header + drawer + background). |
| Theme? | Dark only. |

## 15. Implementation phases (high-level — full plan in writing-plans skill)

Each phase is an independent, commit-and-verify chunk:

1. **Design system foundation** — tokens, primitives (`Glass*`), `LiquidBackground`, `TurbulenceFilter`. Demo page to validate look in isolation.
2. **DB + RPCs** — `admin_actions` table, 5 RPCs in `supabase/admin_users.sql`. SQL-tested.
3. **API endpoints** — 4 handlers under `api/admin/`. `curl`-tested.
4. **AdminDashboard refactor** — extract `AdminStats`, mount `LiquidBackground`, add `AdminTabs`. No behaviour change.
5. **AdminUsers list** — table + search + states (loading/empty/error).
6. **UserDrawer** — detail + 3 actions + audit log + recent diagnostics.
7. **End-to-end verification** — `playwright-cli` flows + manual smoke test in Chrome.

---

*End of spec.*
