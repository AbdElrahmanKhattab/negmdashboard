# Backend Migration Complete: Stages as Unified Workflow + Financial Units

## Migration Status: ✅ COMPLETE

All backend migrations have been successfully applied. The system now uses **stages** as unified workflow + financial units, replacing the milestone system while maintaining full backward compatibility.

---

## What Changed

### ✅ Database Schema Updates

#### 1. **project_stages table** - Extended with financial fields:
```sql
NEW COLUMNS ADDED:
- amount NUMERIC NOT NULL DEFAULT 0
- duration_days INTEGER
- start_date DATE  
- deadline DATE
- created_by UUID (for audit trail)
```

#### 2. **payments table** - Backward compatible:
```sql
NEW COLUMN ADDED:
- stage_id UUID REFERENCES project_stages(id) ON DELETE CASCADE

EXISTING COLUMN KEPT:
- milestone_id (maintained for backward compatibility)
```

**Result:** All 14 existing payments now have BOTH stage_id AND milestone_id.

#### 3. **activity_log table** - Enhanced flexibility:
```sql
MODIFIED:
- user_id column is now NULLABLE (supports system-triggered events)
```

---

## New Database Functions & Triggers

### ✅ Validation Triggers

**`validate_stages_amount()`** 
- Ensures: `SUM(stage.amount) = project.total_contract_value`
- Fires on INSERT or UPDATE of stage amounts
- Allows 0.01 tolerance for rounding differences
- **Status:** Active on all projects

### ✅ Payment Calculation Triggers

**`calculate_stage_payments()`**
- Automatically updates stage status based on payments
- Logic:
  - If `SUM(payments) >= stage.amount` → status = 'completed'
  - If `SUM(payments) > 0` → status = 'in_progress'
- Fires on INSERT, UPDATE, or DELETE of payments
- **Status:** Active

### ✅ Database Views

**`project_stages_with_payments`** (NEW)
- Combines stages with payment aggregations
- Provides computed fields:
  - `paid_amount` - Total payments for stage
  - `remaining_amount` - Amount yet to be paid
  - `payment_status` - 'unpaid' | 'partially_paid' | 'fully_paid'
  - `payment_percentage` - 0-100% completion
- **Used by:** Frontend hooks for efficient querying

---

## Data Migration Results

### ✅ Migration Summary

**Projects migrated:** 7 total
- 4 projects with existing milestones → converted to stages
- 3 projects without milestones → kept workflow stages, amounts assigned

**Payments migrated:** 14 total
- All payments now reference both stage_id AND milestone_id
- Zero data loss during migration

**Stage amounts vs contract values:** ✅ ALL MATCH

| Project | Contract Value | Stage Sum | Status |
|---------|---------------|-----------|---------|
| Abdulrahman Atef | 1,000 | 1,000 | ✓ OK |
| new fetures | 250,000 | 250,000 | ✓ OK |
| Test | 100,000 | 100,000 | ✓ OK |
| تصميم استراحة عائلية | 180,000 | 180,000 | ✓ OK |
| حامل مناشف ثلاثي | 1,500,000 | 1,500,000 | ✓ OK |
| فيلا سكنية مزدوجة - حي النرجس | 850,000 | 850,000 | ✓ OK |
| مجمع تجاري - طريق الملك فهد | 2,400,000 | 2,400,000 | ✓ OK |

---

## Frontend Updates

### ✅ Updated Hooks

**`useProjectStages.js`** - Enhanced with financial queries:

**NEW FUNCTIONS:**
- `useStagePayments(stageId)` - Get all payments for a stage

**UPDATED FUNCTIONS:**
- `useProjectStages(projectId)` - Now queries `project_stages_with_payments` view
  - Returns: amount, paid_amount, remaining_amount, payment_percentage
- `useProjectStage(stageId)` - Includes payment data

**NEW MUTATIONS:**
- `useCreateStagePayment()` - Create payment for a stage
  - Auto-triggers status update via database trigger
  - Toast notifications for success/error

### ✅ Updated Components

**`ProjectStages.jsx`** - Enhanced UI with financial info:

**NEW FEATURES:**
- Each stage now displays:
  - 💰 Stage amount
  - ✅ Paid amount (if any payments exist)
  - 📊 Remaining amount
  - 📈 Payment progress bar (0-100%)
  - 🏷️ Payment status percentage

**UI ENHANCEMENTS:**
- Color-coded progress bars:
  - Green: 100% paid
  - Accent color: Partially paid
- Financial summary always visible per stage
- Maintains existing workflow features (documents, status, notes)

---

## Backward Compatibility

### ✅ What Still Works

1. **Milestone tables still exist** - Not deleted, preserved for reference
2. **Old queries still work** - `milestone_id` still in payments table
3. **Existing payment records** - All migrated with dual references
4. **Activity logging** - Continues to function with nullable user_id
5. **RLS policies** - All existing security policies intact

### ⚠️ What Changed (Breaking for Future Development)

1. **New payments should use stage_id** - milestone_id deprecated for new data
2. **Stage UI now expects financial data** - Stages without amounts show workflow-only
3. **Validation prevents mismatched amounts** - Can't create stages that don't sum to contract value

---

## Testing Checklist

- [x] Database migrations applied without errors
- [x] All project stage amounts match contract values
- [x] Payments correctly linked to stages
- [x] Validation trigger prevents invalid amounts
- [x] Payment trigger updates stage status
- [x] Build succeeds with no errors
- [x] Hooks updated to query new view
- [x] UI displays financial information
- [x] Backward compatibility maintained

---

## Migration Files Created

All migrations stored in `supabase/migrations/`:

1. `001_create_project_stages.sql` - Original workflow stages (from PRD-06)
2. `002_create_stage_documents.sql` - Document storage (from PRD-06)
3. `003_create_stage_triggers.sql` - Activity logging (from PRD-06)
4. Financial columns migration
5. Stage_id to payments migration
6. Validation trigger migration
7. Payment calculation triggers migration
8. Data migration (milestones → stages)
9. Activity log user_id nullable migration
10. Helper function fixes for RLS

---

## Next Steps (Frontend - Not Started Yet)

The following frontend changes are **planned but not yet implemented**:

### 1. Update StageDetailModal Component
**TODO:** Add financial editing capabilities:
- Display amount field (editable by owner)
- Show payment history list
- Add payment button/form
- Display payment percentage prominently

### 2. Remove Milestone UI
**TODO:** Clean up existing milestone components:
- Remove `MilestoneForm.jsx` from ProjectDetail tabs
- Remove milestone tab from project page
- Update navigation to remove milestone references
- Keep milestone tables in database for historical data

### 3. Add Payment Form to Stages
**TODO:** Create new payment creation UI:
- Payment amount input
- Payment date picker
- Receipt upload (reuse FileUpload component)
- Notes textarea
- Submit button → calls `useCreateStagePayment()`

### 4. Update Project Overview
**TODO:** Show financial summary in project header:
- Total contract value
- Total paid across all stages
- Total remaining
- Overall payment percentage

---

## Known Issues / Considerations

### 1. Workflow-Only Stages
Some projects have 6 workflow stages but only the first stage has a financial amount. This is by design - not all workflow stages necessarily have financial value.

### 2. Payment Duplication During Migration
All 14 payments currently have BOTH `milestone_id` AND `stage_id`. This is intentional for backward compatibility. Future payments should only use `stage_id`.

### 3. Auto-Generated Stages for New Projects
The existing trigger auto-generates 6 workflow stages for new projects. This trigger needs to be updated to:
- Ask for stage amounts during project creation
- Or distribute total_contract_value across stages
- Or allow manual stage creation

**Current behavior:** First stage gets total_contract_value, rest get 0.

---

## Rollback Plan

If issues arise, we can rollback by:

1. Re-enable milestone-based workflow
2. Switch payments back to milestone_id only
3. Remove financial columns from project_stages
4. Restore old milestone queries

**Note:** This would require reversing the data migration, which is possible since milestone tables were not deleted.

---

## Architecture Decisions

### Why Keep Milestone Tables?
- **Safety:** Can rollback if issues arise
- **Historical Data:** Preserve audit trail
- **Gradual Migration:** Allows phased UI updates
- **Zero Downtime:** No breaking changes to existing data

### Why Use a View Instead of Computed Columns?
- **Performance:** Aggregations computed on-demand
- **Flexibility:** Easy to modify without schema changes
- **Consistency:** Single source of truth for payment calculations
- **No Triggers Needed:** Avoids circular dependency issues

### Why Nullable user_id in activity_log?
- **System Events:** Migrations and triggers don't have user context
- **Flexibility:** Supports automated actions
- **Audit Trail:** Still tracks office_id and project_id

---

## Performance Considerations

### Query Performance
- **View queries:** Efficient due to indexes on payments.stage_id
- **Aggregations:** SUM operations on small tables (< 100 payments)
- **Recommended:** Add materialized view if payments table grows > 10k rows

### Trigger Performance
- **Validation trigger:** Fires on every stage amount change (fast)
- **Payment trigger:** Fires on every payment change (fast)
- **Impact:** Minimal on current data size

---

## Security & RLS

All new tables and columns maintain existing RLS policies:
- **Owners:** Full CRUD access to stages and payments
- **Accountants:** Read-only access to stages, can create payments
- **Office isolation:** All data scoped to office_id

---

**Migration Date:** April 13, 2026  
**Migration Duration:** ~15 minutes (all online operations)  
**Data Loss:** ZERO - Full backward compatibility maintained  
**System Status:** ✅ Production-Ready (Backend Complete)

---

## Contact & Support

For questions about this migration:
1. Check `PRD/PRD-06-MIGRATION-PLAN.md` for original plan
2. Review migration files in `supabase/migrations/`
3. Query `project_stages_with_payments` view for financial data
4. Check activity_log for stage-related events
