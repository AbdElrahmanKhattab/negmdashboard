# PRD-02 — Financials: Payments, Transactions, Late Fees & Dashboard
**Project:** EngiTrack
**Version:** 1.0 MVP

---

## 1. Overview

This document covers all financial features: payment recording, transaction log, late fee logic, and the main dashboard analytics. Financial data is the core value of EngiTrack — every screen should make it immediately clear what money is owed, what's been paid, and what the office's financial health looks like.

---

## 2. Payment Flow

### 2.1 Recording a Payment

Triggered from: Milestone detail page → "Add Payment" button (Owner and Accountant).

**Form fields:**
| Field | Type | Required |
|---|---|---|
| Amount | number | ✅ |
| Payment date | date picker | ✅ |
| Notes | text | ❌ |
| Receipt file | file upload (.pdf, .jpg, .png, max 10MB) | ❌ |

**On submit:**
1. Insert into `payments`
2. Recalculate milestone paid total → if fully paid, set `milestones.status = 'paid'`
3. Auto-insert `transactions` row (`type: income`, `category: project_payment`)
4. Recalculate project health
5. Insert `activity_log` entry
6. Insert `notifications` row for all office owners: "Payment received for [Milestone Name]"

### 2.2 Partial Payments

A milestone can have multiple partial payments. The milestone status stays `pending` until:
```
SUM(payments.amount_paid) >= milestones.amount
```

UI shows a payment progress bar on the milestone card:
```
Paid: EGP 15,000 / EGP 25,000   [████████░░░░] 60%
```

### 2.3 Late Fee Application

When recording a payment on a `late` milestone:
- System displays: "This milestone is X days overdue. Calculated late fee: EGP [amount]"
- Checkbox: "Apply late fee to this payment"
- If checked: `amount_paid` includes the late fee amount; late fee is noted in payment notes automatically

Late fee formula:
```
late_fee = milestone.amount × (late_fee_rate / 100) × days_overdue
```

This is **informational by default** — the user decides to apply it or not.

### 2.4 Receipt Storage

- Uploaded to Supabase Storage bucket: `receipts/{office_id}/{milestone_id}/{filename}`
- Private bucket — accessed via signed URLs (1 hour expiry)
- Receipt is viewable from the milestone detail in a modal (PDF viewer or image preview)
- Receipt URL stored in `payments.receipt_url`

---

## 3. Transactions Log

### 3.1 Page Layout

Full-width table with:
- **Filters bar:** Type (income/expense), Category (multi-select), Date range, Project (search), Search text
- **Summary strip above table:**
  ```
  Total Income: EGP X    Total Expenses: EGP Y    Net: EGP Z
  ```
  (These numbers respond to active filters — if you filter by date range, summary reflects that range)

- **Table columns:** Date | Title | Type | Category | Project | Amount | Created by | Actions

### 3.2 Adding Manual Transactions

**Income (manual):**
- For payments NOT tied to a milestone (e.g. consultation, retainer)
- Fields: title, amount, date, project (optional), notes
- Category auto-set to `project_payment`

**Expense:**
- Fields: title, amount, category (select), date, project link (optional), notes
- Both owner and accountant can create expenses

### 3.3 CSV Export

Button: "Export" → downloads CSV of current filtered view.
Columns: date, title, type, category, project_name, amount, created_by_name, notes

---

## 4. Dashboard

The main landing screen after login. Designed for quick situational awareness — answer in under 5 seconds: *How is the office doing?*

### 4.1 KPI Cards Row (top)

| Card | Value | Sub-label |
|---|---|---|
| Total Revenue (this month) | EGP X | ↑/↓ vs last month |
| Total Expenses (this month) | EGP X | ↑/↓ vs last month |
| Net Profit (this month) | EGP X | Positive/Negative color |
| Active Projects | N | X clients |
| Pending Payments | EGP X | Across N milestones |
| Overdue Milestones | N | Shown in red if > 0 |

### 4.2 Revenue vs Expenses Chart

- Type: Bar chart (grouped) or Area chart
- X-axis: Last 6 months
- Y-axis: EGP amount
- Series: Income (blue), Expenses (red/orange), Net (line overlay)
- Library: Recharts

### 4.3 Upcoming Milestones Widget

List of next 5 milestones with deadlines in the next 30 days:
```
[Client Name] / [Project Name]
Milestone: [Name]    Due: [X days]    Amount: EGP X    Status badge
```
Click → navigates to milestone detail.

### 4.4 Overdue Milestones Alert Panel

Shown only if overdue milestones exist. Red-bordered card:
```
⚠️ 3 milestones are overdue
[Client A / Project B / Milestone C - 12 days late]
[Client D / Project E / Milestone F - 3 days late]
```

### 4.5 Project Health Summary

Donut chart or 3-number row:
```
🟢 Good: 8    🟡 Warning: 3    🔴 Critical: 1
```
Click on any → filters to /projects with that health filter applied.

### 4.6 Recent Activity Feed

Last 10 activity log entries across all projects:
```
[Avatar] Ahmed recorded a payment of EGP 10,000 for [Milestone X]  — 2h ago
[Avatar] Sara created milestone "Final Delivery" in [Project Y]     — 1d ago
```

### 4.7 Monthly Expense Breakdown

Pie/donut chart by category for current month:
- Salaries, Office Rent, Materials, Government Fees, Misc
- Shows % and EGP amount in tooltip

---

## 5. Financial Reports

### 5.1 Monthly Report (Dashboard Widget + Full Page)

**Metrics:**
- Total Revenue (from `transactions` where `type = income` for the month)
- Total Expenses (from `transactions` where `type = expense` for the month)
- Net Profit
- Revenue by Project (bar chart)
- Expense breakdown by Category (donut)
- Unpaid contract value remaining (sum of pending milestones)

**Navigation:** Dashboard → "View Full Report" → `/reports/monthly?month=YYYY-MM`

### 5.2 Project Financial Summary (on Project Detail)

```
Contract Value:      EGP 150,000
Total Collected:     EGP  90,000   (60%)
Remaining:           EGP  60,000
  └─ Pending:        EGP  50,000
  └─ Overdue:        EGP  10,000
```

Progress bar: shows collected vs total.

---

## 6. Late Fee Logic (Full Spec)

### When is late fee calculated?
- `pg_cron` job runs daily at 08:00 (UTC+2)
- Checks all milestones where `deadline < CURRENT_DATE` AND `status = 'pending'`
- Sets `status = 'late'` on those milestones
- Does NOT auto-modify payment amounts — late fee is always shown as advisory

### Display rule
- On milestone card: show `late_fee` badge if status is `late` and `late_fee_rate > 0`
- Format: `Late fee: EGP X (Y days × Z%)`

### When is late fee applied?
- Only when user explicitly checks the "Apply late fee" box during payment recording
- The extra amount is included in `payments.amount_paid` and auto-noted in `payments.notes`

### No compounding
- Late fee is simple interest only: `amount × rate × days`
- No compounding, no penalties on top of penalties

---

## 7. Accountant Restrictions on Financials

- ✅ Can add payments (all fields including receipt)
- ✅ Can add expense transactions
- ❌ Cannot delete transactions
- ❌ Cannot edit existing payments
- ❌ Cannot export data (owner only)
- ✅ Can view full dashboard and reports

---

## 8. Edge Cases

| Scenario | Behavior |
|---|---|
| Payment amount > milestone amount | Allow with confirmation warning: "This payment exceeds the milestone amount. Continue?" |
| Duplicate payment on same day for same milestone | No block — user may record partial payments same day |
| Expense linked to a completed project | Allow — expenses can still come after project close |
| Delete a payment | Owner only. If milestone was 'paid', revert to 'pending'. Log in activity. |
| Net profit is negative | Display in red with clear label "Net Loss" instead of "Net Profit" |
