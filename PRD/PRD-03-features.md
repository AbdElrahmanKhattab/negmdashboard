# PRD-03 — Features: PDF Invoices, Notifications, Timeline & Client Share
**Project:** EngiTrack
**Version:** 1.0 MVP

---

## 1. PDF Invoice Generation

### 1.1 Architecture Decision

**Approach:** Supabase Edge Function (server-side generation)

**Rationale:** PDF must be stored in Supabase Storage after generation so it can be:
- Attached to reminder emails
- Accessed later from the payment history
- Shared via public URL with client

**Library:** `pdf-lib` (pure JS, works in Deno Edge Functions without native deps)

### 1.2 Invoice Trigger Points

1. **Manual trigger:** Milestone detail page → "Generate Invoice" button
2. **Auto-trigger:** When milestone status changes to `paid`, auto-generate and store PDF silently (no user action required)

### 1.3 Edge Function: `generate-invoice`

**Endpoint:** `POST /functions/v1/generate-invoice`

**Payload:**
```json
{
  "milestone_id": "uuid",
  "office_id": "uuid"
}
```

**Function logic:**
1. Fetch milestone + project + client + office data
2. Fetch all payments for this milestone
3. Build PDF using `pdf-lib`
4. Upload to `Storage: invoices/{office_id}/{milestone_id}/invoice.pdf`
5. Return signed URL (24h expiry for download, permanent path for storage)

### 1.4 Invoice Content / Layout

```
┌─────────────────────────────────────┐
│  [Office Logo]    [Office Name]     │
│                   [Office Address]  │
├─────────────────────────────────────┤
│  INVOICE                            │
│  Invoice #: INV-{YYYY}-{sequential} │
│  Date: [today]                      │
├─────────────────────────────────────┤
│  Billed To:                         │
│  [Client Name]                      │
│  [Client Phone / Email]             │
├─────────────────────────────────────┤
│  Project: [Project Name]            │
│  Milestone: [Milestone Name]        │
├─────────────────────────────────────┤
│  Description          Amount        │
│  ─────────────────    ──────        │
│  [Milestone Name]     EGP X         │
│  Late Fee (if any)    EGP Y         │
│  ─────────────────    ──────        │
│  TOTAL                EGP Z         │
├─────────────────────────────────────┤
│  Payment Status: [PAID / PARTIAL]   │
│  Amount Paid: EGP X                 │
│  Remaining:   EGP Y                 │
├─────────────────────────────────────┤
│  Payment History:                   │
│  [Date]  EGP X  [Notes]             │
│  [Date]  EGP Y  [Notes]             │
└─────────────────────────────────────┘
```

**Invoice number format:** `INV-{YYYY}-{office sequential number}` — stored in `payments` or a separate `invoices` table (simple counter per office per year).

### 1.5 Invoice Access

- Owner: generates and downloads from milestone detail
- Accountant: can view/download existing invoices, cannot regenerate
- Client share view: invoice download button visible on milestone row

---

## 2. Notifications System

### 2.1 Architecture

**Storage:** `notifications` table (see PRD-01 schema)
**Delivery:** Supabase Realtime subscription on `notifications` table (frontend)
**Email delivery:** Supabase Edge Function triggered by `pg_cron` for overdue checks (not real-time email on every event — batch daily digest to avoid noise)

### 2.2 Notification Types & Triggers

| Type | Trigger | Recipients |
|---|---|---|
| `milestone_overdue` | pg_cron daily check: milestone deadline passed and status = pending | All owners |
| `payment_received` | After payment INSERT | All owners |
| `milestone_sum_mismatch` | Trigger: sum of milestones ≠ contract value | Project creator (owner) |
| `comment_reply` | After comment INSERT with parent_comment_id | Parent comment author |
| `project_health_changed` | Trigger: project health updated to warning/critical | All owners |

### 2.3 UI — Bell Icon (Header)

- Bell icon in the main navbar
- Red badge showing unread count (hidden if 0)
- Click → dropdown panel (max-height scrollable, last 20 notifications)

**Notification row layout:**
```
[Icon]  [Title]                           [X ago]
        [Body text — 1 line truncated]    [• unread dot if unread]
```

- Click notification → mark as read + navigate to `notifications[i].link`
- "Mark all as read" button at top of dropdown
- Realtime: new notifications appear instantly without page refresh

### 2.4 Email Notifications (Daily Digest)

**pg_cron job at 09:00 UTC+2:**
- Collect all unread `milestone_overdue` and `project_health_changed` notifications from last 24h per user
- If any found, call Edge Function `send-digest-email`
- Edge Function uses Supabase's built-in SMTP (or Resend free tier) to send one digest email per user

**Email format (plain, no heavy templates):**
```
Subject: EngiTrack — Daily Update [Date]

You have X items requiring attention:

OVERDUE MILESTONES:
- [Client / Project] > [Milestone] — X days overdue — EGP amount
- ...

HEALTH ALERTS:
- [Project Name] is now CRITICAL
- ...

Login to EngiTrack → [link]
```

**Toggle in Settings:** Owner can turn off email digest per user.

### 2.5 Notification Retention

- Keep last 90 days of notifications
- `pg_cron` weekly cleanup: delete notifications older than 90 days

---

## 3. Project Timeline View

### 3.1 Where It Lives

Tab inside Project Detail page: `Overview | Milestones | Timeline | Comments | Activity`

### 3.2 Layout

Horizontal timeline showing all milestones of the project plotted against time.

**Visual design:**
```
[Project Start]──●──────●─────────●──────────●──[Today]──────●──[End date]
                M1       M2        M3         M4              M5
               (Paid)  (Paid)   (Late!)    (Pending)       (Pending)
```

- Each milestone is a dot/node on the timeline line
- Dot color matches status: green (paid), yellow (pending), red (late)
- Hover/click on dot → popover showing:
  - Milestone name
  - Amount due
  - Deadline
  - Status + days overdue if late
  - "View Details" link → milestone detail

**"Today" marker:** Vertical line showing current date position on the timeline.

**Out-of-view navigation:** If timeline is longer than viewport, horizontal scroll with sticky project name header.

### 3.3 Implementation

- Pure CSS + JS (no heavy Gantt library)
- Calculate positions as percentages of total project duration
- Mobile: vertical layout (milestones listed top to bottom with connecting line on the left)

---

## 4. Client Shareable Link

### 4.1 Purpose

Allow engineering offices to send clients a read-only link to view their project status — no login required. Eliminates "what's the update?" phone calls.

### 4.2 Access

- **URL format:** `https://[app-domain]/share/[share_token]`
- `share_token` is a UUID stored on the `projects` table, generated at project creation
- No authentication required — Supabase RLS allows SELECT on projects/milestones where token matches

### 4.3 What the Client Sees

Clean, minimal page (not the full admin UI):

```
┌────────────────────────────────────────┐
│  [Office Logo + Name]                  │
├────────────────────────────────────────┤
│  Project: [Name]                       │
│  Status: Active  Health: 🟢 Good       │
│  Contract Value: EGP X                 │
│  Paid to Date:   EGP Y   (Z%)          │
├────────────────────────────────────────┤
│  MILESTONES                            │
│                                        │
│  ✅ Milestone 1 — EGP X               │
│     Paid on: Jan 12, 2026             │
│     [Download Invoice]                │
│                                        │
│  🕐 Milestone 2 — EGP X              │
│     Due: Mar 30, 2026                 │
│     [Download Invoice if exists]      │
│                                        │
│  ⏳ Milestone 3 — EGP X              │
│     Due: May 15, 2026                 │
└────────────────────────────────────────┘
```

**What the client does NOT see:**
- Late fees
- Internal notes or comments
- Other clients or projects
- Expense data
- Team member names or activity log

### 4.4 Share Link Management (Owner UI)

On Project Detail, in the header area:
- "Share with Client" button → copies link to clipboard + shows modal with QR code
- "Regenerate Link" button → generates new `share_token`, invalidates old link
  - Confirmation dialog: "This will invalidate the existing client link. Are you sure?"

### 4.5 Security

- RLS policy: `SELECT` only on `projects` and `milestones` where `share_token` = request header/param
- No writes allowed from share route (no Supabase client with anon key that has write access)
- Invoice download uses signed URLs (time-limited), not public permanent URLs
- Rate limiting on share route: 100 requests/hour per IP (Supabase Edge Function or Vercel middleware)

---

## 5. Activity Log (UI Detail)

Covered in schema in PRD-01. UI spec:

### 5.1 Activity Tab on Project Detail

Chronological feed, newest first:

```
[Avatar] Ahmed marked "Milestone 2" as paid  ·  2h ago
[Avatar] Sara added a comment                ·  5h ago
[Avatar] Ahmed uploaded receipt for M2       ·  5h ago
[Avatar] System  Milestone 3 is now LATE     ·  1d ago  [system badge]
[Avatar] Ahmed changed project status to     ·  3d ago
         Active → On Hold
```

- Avatar: user initials circle if no photo
- System events: grey italic, "System" label
- Hover on timestamp → shows exact datetime tooltip
- No pagination in MVP — load last 50 entries, "Load more" button

### 5.2 What Gets Logged

| Event | Log entry |
|---|---|
| Project created | "Created project [Name]" |
| Project status changed | "Changed status: Active → On Hold" |
| Milestone created | "Added milestone [Name] — EGP X due [Date]" |
| Milestone status changed | "Milestone [Name] is now [Status]" |
| Payment recorded | "Recorded payment of EGP X for [Milestone]" |
| Comment added | "Added a comment" |
| Invoice generated | "Generated invoice for [Milestone]" |
| Share link regenerated | "Regenerated client share link" |

---

## 6. Project Health Indicator (Full Logic)

### 6.1 Badge Placement

- Project cards (list view): badge in top-right corner
- Project detail header: large badge next to project name
- Client detail: summary badge on each project row
- Dashboard: donut chart by health status

### 6.2 Auto-Calculation Rule

Runs as Postgres trigger after INSERT/UPDATE on `milestones`:

```sql
CRITICAL if:
  COUNT(milestones WHERE status = 'late' AND days_overdue > 30) >= 1
  OR COUNT(milestones WHERE status = 'late') >= 2

WARNING if:
  COUNT(milestones WHERE status = 'late') = 1
  OR (end_date IS NOT NULL AND end_date - CURRENT_DATE < 14 AND has_pending_milestones)

GOOD otherwise
```

### 6.3 Health Change Notification

When health changes from `good` → `warning` or `warning` → `critical`, insert notification for owners.

When health improves (e.g. `critical` → `warning` after payment), also insert notification: "Project [Name] health improved to Warning."
