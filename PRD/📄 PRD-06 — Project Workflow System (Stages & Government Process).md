# PRD-06 — Project Workflow System (Stages & Process Tracking)

**Project:** EngiTrack
**Version:** 1.0 MVP Extension
**Type:** Feature Extension (Non-breaking)

---

## 1. Overview

This feature introduces a **Project Workflow System** that models real-world engineering office processes.

Unlike milestones (financial tracking), this system tracks **administrative and governmental progress** of a project.

Each project must move through a predefined sequence of stages such as:

* Building License (رخصة البناء)
* Requirements (الاشتراطات)
* Correction (التصحيح)
* Sorting (الفرز)
* Occupancy (الإشغال)
* Execution (تنفيذ المشروع) — optional

---

## 2. Objective

Enable the office to answer:

> “Where is this project currently in its real-world process?”

This reduces:

* Lost transactions
* Forgotten paperwork
* Lack of visibility

---

## 3. Core Concept

Each **Project** contains:

* Financial layer → Milestones (existing)
* Workflow layer → Stages (new)

These two systems are **independent but complementary**

---

## 4. Data Model

### 4.1 `project_stages`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id      uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL
stage_name      text NOT NULL
status          text CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started'
request_number  text
notes           text
order_index     integer NOT NULL DEFAULT 0
created_at      timestamptz DEFAULT now()
updated_at      timestamptz
```

---

### 4.2 `stage_documents`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
stage_id        uuid REFERENCES project_stages(id) ON DELETE CASCADE NOT NULL
file_url        text NOT NULL
type            text
uploaded_at     timestamptz DEFAULT now()
```

---

## 5. Default Stages

On project creation, automatically insert:

| Order | Stage Name (EN) | Stage Name (AR) |
| ----- | --------------- | --------------- |
| 1     | license         | رخصة البناء     |
| 2     | requirements    | الاشتراطات      |
| 3     | correction      | التصحيح         |
| 4     | sorting         | الفرز           |
| 5     | occupancy       | الإشغال         |

Optional (configurable):
| 6 | execution | تنفيذ المشروع |

---

## 6. Business Logic

### 6.1 Stage Status

| Status      | Meaning      |
| ----------- | ------------ |
| not_started | لم يبدأ      |
| in_progress | جاري التنفيذ |
| completed   | مكتمل        |

---

### 6.2 Progress Calculation

```
progress = (completed_stages / total_stages) * 100
```

Used for:

* Project overview
* Dashboard insights (future)

---

### 6.3 Activity Logging

Log events:

| Event                | Description                     |
| -------------------- | ------------------------------- |
| stage_created        | Stage added                     |
| stage_updated        | Notes or request number updated |
| stage_status_changed | Status change                   |

---

### 6.4 Permissions

| Action           | Owner | Accountant |
| ---------------- | ----- | ---------- |
| View stages      | ✅     | ✅          |
| Update stage     | ✅     | ❌          |
| Upload documents | ✅     | ❌          |

---

## 7. API / Data Access

### Queries:

* Get stages by project_id
* Get documents by stage_id

### Mutations:

* Update stage status
* Update request_number
* Add document
* Delete document (owner only)

---

## 8. UI/UX Specification

### 8.1 Location

Inside Project Detail page:

Tabs:

* Overview
* Milestones
* **Stages (new)**
* Timeline
* Comments
* Activity

---

### 8.2 Stages View

Preferred layout: **Horizontal Timeline**

Alternative: Vertical Stepper

---

### 8.3 Stage Card

Each stage displays:

* Stage name (Arabic)
* Status badge
* Request number
* Notes preview
* Actions:

  * Edit
  * Upload file

---

### 8.4 Status Colors

| Status      | Color  |
| ----------- | ------ |
| not_started | Gray   |
| in_progress | Yellow |
| completed   | Green  |

---

### 8.5 Stage Detail Panel

Opens on click:

Fields:

* Request number
* Notes
* Status selector
* File upload

---

### 8.6 Document Handling

* Stored in Supabase Storage
* Path:

```
stage_documents/{project_id}/{stage_id}/{file}
```

---

### 8.7 Progress Indicator

Add to project header:

```
Progress: 60% (3/5 stages completed)
```

---

## 9. Integration with Existing System

| System        | Relation          |
| ------------- | ----------------- |
| Projects      | Parent entity     |
| Milestones    | Independent       |
| Payments      | No relation       |
| Activity Log  | Integrated        |
| Notifications | Optional (future) |

---

## 10. Non-Goals (Important)

This feature does NOT:

* Replace milestones
* Affect payments
* Affect financial reports

---

## 11. Future Enhancements (Phase 2)

* Notifications for stuck stages
* SLA tracking (time per stage)
* WhatsApp alerts
* Custom stage templates per office
* Auto-deadline tracking

---

## 12. Risks

| Risk                      | Mitigation                   |
| ------------------------- | ---------------------------- |
| Over-complication         | Keep stages fixed in MVP     |
| Confusion with milestones | Separate UI clearly          |
| Data inconsistency        | Use default stage generation |

---

## 13. Acceptance Criteria

* Project auto-generates stages
* User can update stage status
* User can attach documents per stage
* Stages visible in project UI
* Progress % calculated correctly
* No impact on existing features

---

## 14. Summary

This feature transforms EngiTrack from:

❌ Basic project tracker
➡️
✅ Real-world engineering workflow system

It aligns the system with how engineering offices actually operate.
