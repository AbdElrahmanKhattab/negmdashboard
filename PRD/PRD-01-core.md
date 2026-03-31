# PRD-01 — Core: Data Model, Auth, CRUD
**Project:** EngiTrack — Engineering Office Management System
**Version:** 1.0 MVP
**Stack:** React + Vite, Supabase (Auth, DB, Storage, Edge Functions, Realtime)

---

## 1. Overview

EngiTrack is an internal management system for small engineering offices (2–5 users). It allows teams to track clients, projects, milestones, payments, and expenses in one place. This document covers the foundational layer: database schema, authentication, roles, and all CRUD operations.

---

## 2. Database Schema

### 2.1 `offices`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL
logo_url      text
created_at    timestamptz DEFAULT now()
```

### 2.2 `users`
Extends Supabase `auth.users`.
```sql
id            uuid PRIMARY KEY REFERENCES auth.users(id)
office_id     uuid REFERENCES offices(id)
full_name     text NOT NULL
role          text CHECK (role IN ('owner', 'accountant')) NOT NULL
avatar_url    text
created_at    timestamptz DEFAULT now()
```

### 2.3 `clients`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
office_id     uuid REFERENCES offices(id) NOT NULL
name          text NOT NULL
phone         text
email         text
address       text
notes         text
created_at    timestamptz DEFAULT now()
created_by    uuid REFERENCES users(id)
```

### 2.4 `projects`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
office_id           uuid REFERENCES offices(id) NOT NULL
client_id           uuid REFERENCES clients(id) NOT NULL
name                text NOT NULL
description         text
total_contract_value numeric(12, 2) NOT NULL DEFAULT 0
status              text CHECK (status IN ('active', 'completed', 'on_hold')) DEFAULT 'active'
health              text CHECK (health IN ('good', 'warning', 'critical')) DEFAULT 'good'
start_date          date
end_date            date
contract_file_url   text
share_token         uuid DEFAULT gen_random_uuid() UNIQUE
created_at          timestamptz DEFAULT now()
created_by          uuid REFERENCES users(id)
```

**Health auto-calculation rule (pg trigger):**
- `good`     → all milestones on time or paid
- `warning`  → 1 milestone overdue
- `critical` → 2+ milestones overdue OR any milestone > 30 days overdue

### 2.5 `milestones`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id      uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL
name            text NOT NULL
amount          numeric(12, 2) NOT NULL DEFAULT 0
deadline        date
status          text CHECK (status IN ('pending', 'paid', 'late')) DEFAULT 'pending'
late_fee_rate   numeric(5, 2) DEFAULT 0  -- percentage, e.g. 2.5 = 2.5%
order_index     integer NOT NULL DEFAULT 0
created_at      timestamptz DEFAULT now()
created_by      uuid REFERENCES users(id)
```

**Late fee trigger:** `pg_cron` job runs daily at 08:00. For every milestone where `deadline < now()` AND `status = 'pending'`, set `status = 'late'` and insert a notification.

**Milestone sum validation trigger:** After INSERT or UPDATE on milestones, compare SUM(milestones.amount) for project vs `projects.total_contract_value`. If mismatch > 0.01, insert a warning notification to the project owner.

### 2.6 `payments`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
milestone_id    uuid REFERENCES milestones(id) ON DELETE CASCADE NOT NULL
office_id       uuid REFERENCES offices(id) NOT NULL
amount_paid     numeric(12, 2) NOT NULL
paid_at         timestamptz DEFAULT now()
receipt_url     text
notes           text
created_by      uuid REFERENCES users(id)
```

After full payment inserted, trigger updates `milestones.status = 'paid'` and recalculates project health.

### 2.7 `transactions`
Unified table for both income and expenses.
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
office_id       uuid REFERENCES offices(id) NOT NULL
type            text CHECK (type IN ('income', 'expense')) NOT NULL
title           text NOT NULL
amount          numeric(12, 2) NOT NULL
category        text CHECK (category IN (
                  'project_payment',
                  'salaries',
                  'office_rent',
                  'materials',
                  'government_fees',
                  'misc'
                )) NOT NULL
date            date NOT NULL DEFAULT CURRENT_DATE
project_id      uuid REFERENCES projects(id)  -- nullable
milestone_id    uuid REFERENCES milestones(id) -- nullable, for auto-created income entries
notes           text
created_by      uuid REFERENCES users(id)
created_at      timestamptz DEFAULT now()
```

**Auto-income rule:** When a payment is recorded, auto-insert a `transactions` row with `type = 'income'`, `category = 'project_payment'`, linked to the same project/milestone. This keeps the transaction log complete without manual entry.

### 2.8 `comments`
Threaded comments per project.
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id        uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL
office_id         uuid REFERENCES offices(id) NOT NULL
user_id           uuid REFERENCES users(id) NOT NULL
parent_comment_id uuid REFERENCES comments(id) -- nullable, for replies
content           text NOT NULL
created_at        timestamptz DEFAULT now()
updated_at        timestamptz
```

### 2.9 `activity_log`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
office_id   uuid REFERENCES offices(id) NOT NULL
project_id  uuid REFERENCES projects(id)  -- nullable (some actions are office-level)
user_id     uuid REFERENCES users(id) NOT NULL
action      text NOT NULL  -- e.g. 'created_milestone', 'marked_paid', 'added_comment'
entity_type text           -- 'milestone' | 'payment' | 'project' | 'comment'
entity_id   uuid
metadata    jsonb          -- extra details, e.g. { "from": "pending", "to": "paid" }
created_at  timestamptz DEFAULT now()
```

All mutations (INSERT/UPDATE/DELETE on key tables) are logged via Postgres triggers.

### 2.10 `notifications`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
office_id   uuid REFERENCES offices(id) NOT NULL
user_id     uuid REFERENCES users(id) NOT NULL
type        text CHECK (type IN (
              'milestone_overdue',
              'payment_received',
              'milestone_sum_mismatch',
              'comment_reply',
              'project_health_changed'
            )) NOT NULL
title       text NOT NULL
body        text
read        boolean DEFAULT false
link        text  -- frontend route to navigate to on click
entity_id   uuid  -- the related project/milestone/comment
created_at  timestamptz DEFAULT now()
```

---

## 3. Authentication & Roles

### 3.1 Auth Flow
- Supabase Auth (email + password)
- On first sign-up: create `office` row + `user` row with `role = 'owner'`
- Additional team members: Owner invites via email → Supabase invite flow → user sets password → `user` row created with assigned role

### 3.2 Role Permissions Matrix

| Action | Owner | Accountant |
|---|---|---|
| View clients | ✅ | ✅ |
| Add/edit clients | ✅ | ❌ |
| View projects | ✅ | ✅ |
| Create/edit projects | ✅ | ❌ |
| Delete projects | ✅ | ❌ |
| Change project status | ✅ | ❌ |
| View milestones | ✅ | ✅ |
| Add/edit milestones | ✅ | ❌ |
| Add payments | ✅ | ✅ |
| View transactions | ✅ | ✅ |
| Add expense transactions | ✅ | ✅ |
| View dashboard | ✅ | ✅ |
| Manage team members | ✅ | ❌ |
| Add comments | ✅ | ✅ |

### 3.3 RLS Policies (Supabase)
Every table has `office_id`. Base policy:
```sql
-- All tables: users can only see their own office's data
USING (office_id = (SELECT office_id FROM users WHERE id = auth.uid()))
```

Owner-only tables add:
```sql
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
)
```

Accountant write-only for payments + transactions:
```sql
-- payments: accountant can INSERT but not DELETE
-- transactions: accountant can INSERT expense type only
```

Public share (no auth) for project share link:
```sql
-- projects: allow SELECT where share_token = request param, no auth required
-- milestones: allow SELECT if project's share_token matches
```

---

## 4. Pages & Routes

```
/                       → redirect to /dashboard
/login                  → Login page
/dashboard              → Dashboard (KPIs, charts, alerts)
/clients                → Client list
/clients/:id            → Client detail (all their projects)
/projects               → All projects list
/projects/:id           → Project detail (milestones, comments, activity, share)
/projects/:id/milestones/:milestoneId → Milestone detail + payments
/transactions           → Transactions log (income + expenses)
/settings               → Office settings, team management
/share/:shareToken      → Public client view (no auth)
```

---

## 5. CRUD Specifications

### 5.1 Clients
- **List:** paginated table, search by name/phone, sortable
- **Create:** name (required), phone, email, address, notes
- **Edit:** all fields
- **Delete:** soft delete (only if no active projects)
- **Detail:** shows all projects with health badge and financial summary

### 5.2 Projects
- **List:** filter by client, status, health; sort by date/value
- **Create:** client (required), name, description, total_contract_value, start_date, end_date, upload contract file
- **Edit:** all fields; status change (owner only)
- **Delete:** owner only; blocked if has payments
- **Detail:** tabs → Overview | Milestones | Comments | Activity

### 5.3 Milestones
- **List (within project):** ordered by `order_index`, drag to reorder (owner only)
- **Create:** name, amount, deadline, late_fee_rate; auto-validate sum vs contract value
- **Edit:** all fields; status cannot be manually set to 'paid' (must go through payment flow)
- **Delete:** only if no payments exist against it

### 5.4 Payments
- **Add payment:** amount, date, notes, upload receipt (Supabase Storage)
- **Auto-close milestone:** if SUM(payments.amount_paid) >= milestone.amount → status = 'paid'
- **Partial payments:** supported — milestone stays 'pending' until fully paid
- **Receipt view:** opens in modal from Supabase Storage URL

### 5.5 Transactions
- **List:** filter by type, category, date range, project; export to CSV
- **Create income:** manual only if not from a payment (e.g. retainer, consultation fee)
- **Create expense:** title, amount, category, date, optional project link, notes
- **Edit/Delete:** owner only

### 5.6 Comments
- **Thread view:** top-level comments + indented replies (1 level deep max)
- **Create:** any authenticated user
- **Edit:** own comment only, within 30 minutes of posting
- **Delete:** own comment (owner can delete any)
- **Reply:** creates comment with `parent_comment_id` set
- **Realtime:** new comments appear instantly via Supabase Realtime

---

## 6. Key Business Logic

1. **Milestone late fee:** `late_amount = milestone.amount * (late_fee_rate / 100) * days_overdue`. Displayed on milestone card but NOT auto-added to payment — user decides whether to apply it when recording payment.

2. **Project health:** recalculated on every milestone status change via trigger.

3. **Share token:** generated on project creation, can be regenerated by owner (old link becomes invalid).

4. **Activity logging:** every CREATE/UPDATE/DELETE on `projects`, `milestones`, `payments`, `transactions`, `comments` inserts an `activity_log` row via Postgres trigger. Includes `metadata` jsonb for before/after values on updates.

---

## 7. Supabase Infrastructure Checklist

- [ ] Enable `pg_cron` extension
- [ ] Enable `uuid-ossp` extension
- [ ] Configure Storage bucket: `receipts` (private), `contracts` (private)
- [ ] Set up Supabase Auth email templates (invite, reset password)
- [ ] Configure Supabase Realtime on `comments` and `notifications` tables
- [ ] Deploy `pg_cron` job: daily milestone status check at 08:00 Cairo time (UTC+2)