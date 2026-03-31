# PRD-04 — UX: Design System, Components & Frontend Architecture
**Project:** EngiTrack
**Version:** 1.0 MVP

---

## 1. Design Philosophy

EngiTrack serves engineers and accountants in a professional office context. The UI should feel like a **premium internal tool** — dense with information but never cluttered, fast to navigate, and visually serious without being cold.

**Aesthetic direction:** Industrial-professional. Dark mode by default. Think "Vercel Dashboard" meets "Linear" — sharp edges, monospaced numbers, precise spacing, subtle depth via layered surfaces.

**Not:** Generic SaaS blue-and-white. No rounded-everything. No stock illustrations.

---

## 2. Tech Stack (Frontend)

```
React 18 + Vite (plain JavaScript, .jsx — no TypeScript)
Tailwind CSS v3
shadcn/ui (headless component primitives)
Framer Motion (animations)
Recharts (dashboard charts)
React Router v6
TanStack Query v5 (data fetching + caching)
Supabase JS Client v2
react-pdf (PDF preview in modal)
@dnd-kit/core (drag-to-reorder milestones)
date-fns (date formatting/calculation)
zod (runtime form validation — works in plain JS)
react-hook-form (form state management)
```

**No TypeScript. No tsconfig. No type annotations.**
All components use `.jsx`, all other files use `.js` (hooks, lib, stores).
Zod is used purely for runtime validation of form inputs — not for static typing.

---

## 3. Design Tokens (CSS Variables)

```css
:root {
  /* Surfaces */
  --bg-base:        #0a0a0a;   /* Page background */
  --bg-surface:     #111111;   /* Card background */
  --bg-elevated:    #1a1a1a;   /* Dropdown, modal */
  --bg-overlay:     #222222;   /* Hover state */

  /* Borders */
  --border-subtle:  #2a2a2a;
  --border-default: #333333;
  --border-strong:  #444444;

  /* Text */
  --text-primary:   #f0f0f0;
  --text-secondary: #888888;
  --text-muted:     #555555;

  /* Brand accent */
  --accent:         #3b82f6;   /* Blue — primary action */
  --accent-hover:   #2563eb;

  /* Status colors */
  --status-good:    #22c55e;   /* green-500 */
  --status-warning: #f59e0b;   /* amber-500 */
  --status-critical:#ef4444;   /* red-500 */
  --status-paid:    #22c55e;
  --status-pending: #6b7280;   /* gray-500 */
  --status-late:    #ef4444;

  /* Financial */
  --income-color:   #22c55e;
  --expense-color:  #f87171;
  --net-positive:   #22c55e;
  --net-negative:   #ef4444;

  /* Typography */
  --font-sans:      'IBM Plex Sans', sans-serif;
  --font-mono:      'IBM Plex Mono', monospace;  /* For all numbers/amounts */
}
```

**Light mode override (optional toggle):**
```css
[data-theme="light"] {
  --bg-base:        #f8f8f8;
  --bg-surface:     #ffffff;
  --bg-elevated:    #f0f0f0;
  --text-primary:   #111111;
  --text-secondary: #555555;
  --border-subtle:  #e5e5e5;
  --border-default: #d0d0d0;
}
```

All EGP amounts displayed in `font-mono`. Consistent numeric alignment in tables.

---

## 4. Layout

### 4.1 App Shell

```
┌──────────────────────────────────────────────────────────┐
│  SIDEBAR (240px fixed)  │  MAIN CONTENT AREA             │
│  ─────────────────────  │  ─────────────────────────     │
│  [Logo]                 │  [Page Header]                 │
│                         │                                │
│  Dashboard              │  [Content]                     │
│  Clients                │                                │
│  Projects               │                                │
│  Transactions           │                                │
│  ─────────────────────  │                                │
│  [User Avatar + Name]   │                                │
│  Settings               │                                │
└──────────────────────────────────────────────────────────┘
```

- Sidebar: fixed, never collapses on desktop
- Mobile (< 768px): sidebar becomes bottom tab bar (Dashboard, Clients, Projects, Transactions)
- Active nav item: `var(--accent)` left border + slightly elevated bg

### 4.2 Page Header Pattern

Every page has a consistent header:
```
[Page Title]                          [Primary Action Button]
[Breadcrumb / subtitle]
```

### 4.3 Content Width

- Max content width: 1280px, centered
- Dashboard: full-width grid
- Lists/tables: full-width
- Detail pages: 2-column on large screens (main content + sidebar panel)

---

## 5. Core Components

### 5.1 `<StatusBadge>`
```jsx
// Props:
// type: 'paid' | 'pending' | 'late' | 'active' | 'completed' | 'on_hold'
// size: 'sm' | 'md'
```
Dot + label. Color from design tokens. No background fill — colored text with matching colored dot only.

### 5.2 `<HealthBadge>`
```jsx
// Props:
// health: 'good' | 'warning' | 'critical'
```
Filled pill. Green/Yellow/Red. Shows emoji + text: "🟢 Good", "🟡 Warning", "🔴 Critical".

### 5.3 `<AmountDisplay>`
```jsx
// Props:
// amount: number
// type: 'income' | 'expense' | 'neutral' (optional)
// size: 'sm' | 'md' | 'lg' (optional)
// showSign: boolean (optional)
```
Always uses `font-mono`. Color-coded if type provided. Example: `EGP 24,500.00`

### 5.4 `<MilestoneCard>`
```
[Name]                              [Status badge]
Due: Mar 30, 2026  ·  EGP 25,000
[Payment progress bar]
Paid: EGP 15,000 / 25,000 (60%)
[Add Payment]  [Generate Invoice]  [Details →]
```

### 5.5 `<ProjectCard>` (list view)
```
[Client Name]                       [Health badge]
[Project Name]
EGP 150,000  ·  Active  ·  3 milestones
[Progress bar: collected vs total]
[Start date] → [End date]
```

### 5.6 `<KPICard>`
```
[Icon]  [Label]
[Large number in mono]
[Trend arrow + % vs last period]
```

### 5.7 `<CommentThread>`
- Top-level comments with indented replies below
- Reply button on each comment → inline reply input appears
- Edit: pencil icon, inline editable (own comment, within 30 min)
- Delete: trash icon with confirmation
- Realtime: new comments appear with subtle slide-in animation

### 5.8 `<ActivityFeed>`
- Timeline layout with vertical line on left
- Avatar circles with initials
- System events: grey italics, no avatar (use ⚙️ icon)

### 5.9 `<NotificationDropdown>`
- Bell icon with unread count badge
- Panel: fixed width 380px, scrollable, max-height 480px
- Each item clickable → marks read + routes
- "Mark all read" in header
- Empty state: "You're all caught up 👌"

### 5.10 `<TimelineView>`
- SVG-based horizontal timeline
- Milestone nodes as circles (16px), color by status
- Connecting line between nodes
- Today marker: blue dashed vertical line
- Tooltip on hover: milestone name, amount, deadline, status
- Mobile: rotate to vertical layout

---

## 6. Animations (Framer Motion)

### 6.1 Page Transitions
```jsx
// Every page wraps content in:
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>
```

### 6.2 List Item Stagger (project/client lists)
```jsx
const containerVariants = {
  animate: { transition: { staggerChildren: 0.04 } }
}
const itemVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 }
}
```

### 6.3 KPI Card Counter Animation
Numbers count up from 0 to value on first render. Use `useSpring` from Framer Motion on the displayed number.

### 6.4 Status Change Feedback
When milestone is marked paid: green checkmark pulse animation on the status badge.

### 6.5 Notification Bell
Subtle shake animation when new notification arrives (Realtime event):
```jsx
animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
transition={{ duration: 0.5 }}
```

### 6.6 Health Badge Change
When project health degrades: badge scales up briefly (1 → 1.15 → 1) + color transition.

### Keep it subtle rule
No animation should exceed 300ms. No looping animations. No animations that block interaction.

---

## 7. Forms & Validation

- All forms use `react-hook-form` + `zod` for schema validation
- Error messages appear inline below the field (not toast)
- Required fields marked with `*` in label
- Submit button shows loading spinner during async operations
- On success: toast notification (bottom-right) + form closes/resets

**Toast library:** `sonner` (lightweight, works well with dark themes)

---

## 8. Empty States

Every list/data view needs an empty state. Keep them minimal — icon + text + action button.

| Page | Empty state text | CTA |
|---|---|---|
| Clients | "No clients yet" | "Add First Client" |
| Projects | "No projects for this client" | "Create Project" |
| Milestones | "No milestones added" | "Add Milestone" |
| Transactions | "No transactions in this period" | "Add Transaction" |
| Notifications | "You're all caught up 👌" | — |
| Activity | "No activity yet" | — |

---

## 9. Responsive Breakpoints

```
Mobile:  < 768px   → bottom tab bar, single column, cards stack vertically
Tablet:  768-1024px → sidebar icon-only (collapsed), 2-col grids
Desktop: > 1024px  → full sidebar, multi-column layouts
```

**Priority:** Desktop first (internal office tool, mostly used on desktop). Mobile gets a working version but is not the primary design target.

---

## 10. Loading States

- **Page-level:** Skeleton screens (not spinners). Match the shape of the content loading.
- **Table rows:** 5 skeleton rows with shimmer animation
- **KPI cards:** Skeleton rectangles in card shape
- **Charts:** Grey placeholder box with loading shimmer

---

## 11. Error States

- **API errors:** Toast with error message + "Try again" if relevant
- **404 page:** Simple centered text + "Back to Dashboard" button
- **Empty share link:** "This project link is no longer valid" (when share_token not found)
- **Network offline:** Banner at top: "You're offline. Changes won't be saved." (use `navigator.onLine`)

---

## 12. Client Share Page (Public) — UX

Distinct visual style from the admin app to feel like a **client-facing deliverable**:

- White/light background (regardless of user's theme setting)
- Office logo prominent at top
- Large, readable typography
- No admin controls visible
- Footer: "Powered by EngiTrack" (subtle branding)
- Print-friendly: CSS `@media print` styles for when client wants to print their project status

---

## 13. Settings Page

### Sections:
1. **Office Profile:** Name, logo upload, address, contact info
2. **Team:** List of users with roles. Owner can invite (email input + role select) or remove members. Max team size MVP: 10 users.
3. **Notifications:** Toggle email digest on/off per user
4. **Expense Categories:** View the fixed categories (no edit in MVP — note as Phase 2)
5. **Danger Zone:** Delete office account (owner only, requires typing office name to confirm)

---

## 14. Accessibility Baseline

- All interactive elements keyboard-navigable
- Focus rings visible (custom styled to match theme)
- Color is never the only indicator of status (always paired with icon or text)
- `aria-label` on icon-only buttons
- Form inputs have associated labels
- Toast announcements for screen readers via `aria-live`

---

## 15. Frontend Folder Structure

```
src/
├── components/
│   ├── ui/           ← shadcn primitives (Button, Input, Dialog, etc.)
│   ├── common/       ← StatusBadge, HealthBadge, AmountDisplay, etc.
│   ├── charts/       ← RevenueChart, ExpenseDonut, ProjectHealthChart
│   └── layout/       ← Sidebar, AppShell, PageHeader
├── pages/
│   ├── dashboard/
│   ├── clients/
│   ├── projects/
│   ├── transactions/
│   ├── settings/
│   └── share/        ← public client view
├── hooks/
│   ├── useProjects.js
│   ├── useMilestones.js
│   ├── useNotifications.js  ← Supabase Realtime
│   └── useAuth.js
├── lib/
│   ├── supabase.js   ← client init
│   ├── queries.js    ← TanStack Query query functions
│   ├── schemas.js    ← all Zod schemas for form validation
│   └── utils.js
└── stores/
    └── authStore.js  ← Zustand (user, office, role)
```

**Note:** No `types/` directory. No `.ts` or `.tsx` files anywhere in the project.