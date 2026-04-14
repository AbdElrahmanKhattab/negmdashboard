# Project Workflow System - Implementation Documentation

## Overview
This document describes the implementation of the **Project Workflow System** (PRD-06) for EngiTrack, which adds a governmental/administrative stage tracking feature to projects.

## What Was Implemented

### ✅ Phase 1: Backend (Database & Supabase)

#### 1. Database Tables

**`project_stages` table**
- Stores workflow stages for each project
- Fields: id, project_id, stage_name, status, request_number, notes, order_index, created_at, updated_at
- Status values: 'not_started', 'in_progress', 'completed'
- RLS enabled with office-based isolation
- Indexes on project_id and order_index for performance

**`stage_documents` table**
- Stores uploaded documents per stage
- Fields: id, stage_id, file_url, type, uploaded_at
- RLS enabled with owner/accountant role separation
- Index on stage_id for performance

#### 2. Automated Triggers

**Auto-generate default stages**
- Trigger fires on project INSERT
- Creates 6 default stages in Arabic:
  1. رخصة البناء (Building License)
  2. الاشتراطات (Requirements)
  3. التصحيح (Correction)
  4. الفرز (Sorting)
  5. الإشغال (Occupancy)
  6. تنفيذ المشروع (Execution - optional)

**Activity logging**
- Logs stage creation, updates, and status changes
- Logs document uploads and deletions
- Stores metadata in JSONB format

**Updated_at timestamp**
- Automatically updates on stage modifications

#### 3. Row Level Security (RLS) Policies

**project_stages:**
- Owners: Full CRUD access via office
- Accountants: Read-only access via office

**stage_documents:**
- Owners: Full CRUD access via office
- Accountants: Read-only access via office

#### 4. Storage Bucket

**`stage_documents` bucket**
- Private bucket for stage-related documents
- Path structure: `{project_id}/{stage_id}/{filename}`
- Policies for authenticated users to read, upload, and delete

---

### ✅ Phase 2: Frontend (React Components)

#### 1. Hook: `useProjectStages.js`

Location: `src/hooks/useProjectStages.js`

**Functions exported:**
- `useProjectStages(projectId)` - Get all stages for a project with documents
- `useProjectStage(stageId)` - Get single stage by ID
- `useUpdateStage()` - Update stage data (status, request_number, notes)
- `useUploadStageDocument()` - Upload document to a stage
- `useDeleteStageDocument()` - Delete document from a stage
- `useStageProgress(projectId)` - Calculate completion percentage

**Features:**
- TanStack React Query integration
- Automatic cache invalidation
- Toast notifications for success/error
- File upload to Supabase Storage
- Progress calculation

#### 2. Component: `ProjectStages.jsx`

Location: `src/components/common/ProjectStages.jsx`

**Features:**
- Progress bar showing % of completed stages
- Vertical timeline/stepper UI
- Stage cards showing:
  - Stage number and name
  - Status badge with icon and color
  - Request number
  - Notes preview
  - Document count
  - Edit button (owner only)
- Color coding:
  - Gray: Not started
  - Yellow: In progress
  - Green: Completed
- Hover effects and transitions

#### 3. Component: `StageDetailModal.jsx`

Location: `src/components/common/StageDetailModal.jsx`

**Features:**
- Modal with stage details
- Status selector (3 options with visual feedback)
- Request number input field
- Notes textarea
- Document management:
  - List uploaded files
  - View files in new tab
  - Delete files (owner only)
  - Upload new files
- Owner-only edit controls
- Responsive design
- RTL layout (Arabic interface)

#### 4. Integration: `ProjectDetail.jsx`

**Changes made:**
- Added "المراحل" (Stages) tab
- Imported ProjectStages component
- Added stage progress indicator to project header
- Shows progress bar with percentage in overview section

---

## Database Migrations

All migrations are stored in `supabase/migrations/`:

1. **001_create_project_stages.sql** - Creates project_stages table with RLS
2. **002_create_stage_documents.sql** - Creates stage_documents table with RLS
3. **003_create_stage_triggers.sql** - Creates auto-generation and logging triggers

All migrations have been applied to the production Supabase project.

---

## Architecture Patterns Followed

✅ **Consistent with existing codebase:**
- Uses same hook patterns (TanStack Query + Supabase)
- Follows component structure (props, state management)
- Matches design system (Tailwind classes, colors)
- RTL layout for Arabic interface
- shadcn/ui component usage

✅ **Non-breaking extension:**
- No existing tables modified
- Cascade delete on project deletion
- Separate from milestones (financial)
- Activity log integration (existing table)

✅ **Security:**
- RLS policies match existing office-based isolation
- Role-based UI (owner vs accountant)
- Storage bucket policies for authenticated users

---

## Testing Checklist

- [x] Database tables created successfully
- [x] RLS policies enabled
- [x] Auto-generation trigger works (new projects get 6 stages)
- [x] Activity logging trigger works (verified in activity_log table)
- [x] Storage bucket created with policies
- [x] All 6 existing projects have stages (36 total stages)
- [x] Frontend components created
- [x] Tab integration complete
- [x] Progress indicator added to overview

---

## How to Use

### For Users:
1. Navigate to any project detail page
2. Click on the "المراحل" (Stages) tab
3. View the progress bar and stage timeline
4. Click the edit icon (pencil) on any stage (owner only)
5. Update status, request number, and notes
6. Upload documents per stage
7. View/delete existing documents

### For Developers:

**Using the hooks:**
```javascript
import { 
  useProjectStages, 
  useUpdateStage, 
  useUploadStageDocument,
  useStageProgress 
} from '@/hooks/useProjectStages';

// Get stages
const { data: stages } = useProjectStages(projectId);

// Update a stage
const updateStage = useUpdateStage();
await updateStage.mutateAsync({
  stageId: 'uuid',
  status: 'in_progress',
  request_number: 'REQ-001',
  notes: 'Some notes'
});

// Upload document
const uploadDoc = useUploadStageDocument();
await uploadDoc.mutateAsync({
  stageId: 'uuid',
  file: fileObject
});

// Get progress
const { data: progress } = useStageProgress(projectId);
// Returns: { total: 6, completed: 3, progress: 50 }
```

---

## Edge Cases Handled

✅ **Project deleted** → All stages cascade delete
✅ **Stage with no request_number** → Allowed (nullable field)
✅ **Multiple documents per stage** → Supported (1:N relationship)
✅ **Accountant viewing** → Read-only UI (no edit buttons)
✅ **Owner editing** → Full access to all fields
✅ **File upload errors** → Toast notifications shown
✅ **Empty stages list** → Graceful empty state message

---

## Future Enhancements (Phase 2 - Not Implemented)

As per PRD-06, these are planned for future:
- Notifications for stuck stages
- SLA tracking (time spent per stage)
- WhatsApp alerts
- Custom stage templates per office
- Auto-deadline tracking
- Stage dependencies (can't complete stage B before A)

---

## Files Created/Modified

### Created:
- `supabase/migrations/001_create_project_stages.sql`
- `supabase/migrations/002_create_stage_documents.sql`
- `supabase/migrations/003_create_stage_triggers.sql`
- `src/hooks/useProjectStages.js`
- `src/components/common/ProjectStages.jsx`
- `src/components/common/StageDetailModal.jsx`

### Modified:
- `src/pages/ProjectDetail.jsx` (added stages tab and progress indicator)

---

## API Reference

### Database Schema

**project_stages:**
```sql
id: uuid (PK, auto-generated)
project_id: uuid (FK → projects.id, cascade delete)
stage_name: text (not null)
status: text (check: not_started | in_progress | completed)
request_number: text (nullable)
notes: text (nullable)
order_index: integer (not null, default 0)
created_at: timestamptz (default now)
updated_at: timestamptz (auto-updated)
```

**stage_documents:**
```sql
id: uuid (PK, auto-generated)
stage_id: uuid (FK → project_stages.id, cascade delete)
file_url: text (not null)
type: text (nullable, file extension)
uploaded_at: timestamptz (default now)
```

---

## Notes

- All UI text is in Arabic as per existing system
- RTL layout maintained throughout
- Uses existing design tokens (colors, spacing)
- Compatible with existing auth system
- No breaking changes to existing features
- Fully integrated with activity logging system

---

## Support

For issues or questions about this implementation:
1. Check the activity_log table for stage-related events
2. Verify RLS policies are correctly set up
3. Ensure storage bucket policies allow authenticated access
4. Check browser console for frontend errors
5. Verify TanStack Query cache is invalidated properly

---

**Implementation Date:** April 13, 2026  
**Status:** ✅ Complete and Production-Ready
