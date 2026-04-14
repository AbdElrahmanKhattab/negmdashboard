# Backend Migration Plan: Stages as Unified Workflow + Financial Units

## Overview
This document outlines the step-by-step backend migration to transform `project_stages` from workflow-only units into unified workflow + financial units, replacing the milestone system while maintaining backward compatibility.

---

## Current State Analysis

### Existing Data (as of migration date):
- **7 projects** in database
- **7 milestones** across projects with payments
- **14 payment records** linked to milestones
- **42 project_stages** (6 per project, workflow-only)
- **231 activity_log entries**

### Current Schema:
```
projects:
  - total_contract_value (numeric, default 0)

milestones:
  - id, project_id, name, amount, deadline, status
  - late_fee_rate, order_index, paid_amount, late_fee_amount
  - created_by, created_at

payments:
  - id, milestone_id (FK), office_id, amount_paid
  - paid_at, receipt_url, notes, created_by

project_stages (current):
  - id, project_id, stage_name, status
  - request_number, notes, order_index
  - created_at, updated_at
```

---

## Migration Strategy

### Phase 1: Schema Changes (Non-Breaking)
**Goal:** Add financial fields to stages without breaking existing functionality

#### Step 1.1: Extend project_stages table
```sql
ALTER TABLE project_stages 
ADD COLUMN amount NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN duration_days INTEGER,
ADD COLUMN start_date DATE,
ADD COLUMN deadline DATE;
```

#### Step 1.2: Add stage_id to payments table (parallel to milestone_id)
```sql
ALTER TABLE payments
ADD COLUMN stage_id UUID REFERENCES project_stages(id) ON DELETE CASCADE;
```

**Rationale:** Keep `milestone_id` temporarily for backward compatibility. New payments use `stage_id`.

#### Step 1.3: Add validation trigger for amount consistency
```sql
CREATE OR REPLACE FUNCTION validate_stages_amount()
RETURNS TRIGGER AS $$
DECLARE
    total_stages_amount NUMERIC;
    project_total NUMERIC;
BEGIN
    -- Sum all stage amounts for this project
    SELECT COALESCE(SUM(amount), 0) INTO total_stages_amount
    FROM project_stages
    WHERE project_id = NEW.project_id;
    
    -- Get project total_contract_value
    SELECT total_contract_value INTO project_total
    FROM projects
    WHERE id = NEW.project_id;
    
    -- Validate (allow small rounding differences)
    IF ABS(total_stages_amount - project_total) > 0.01 THEN
        RAISE EXCEPTION 'Stage amounts (%) do not match project total contract value (%)', 
            total_stages_amount, project_total;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_stages_amount_trigger
    AFTER INSERT OR UPDATE ON project_stages
    FOR EACH ROW
    EXECUTE FUNCTION validate_stages_amount();
```

---

### Phase 2: Payment Logic & Auto-Calculation

#### Step 2.1: Create payment aggregation function
```sql
CREATE OR REPLACE FUNCTION calculate_stage_payments()
RETURNS TRIGGER AS $$
DECLARE
    stage_id_var UUID;
    total_paid NUMERIC;
    stage_amount NUMERIC;
BEGIN
    -- Determine which stage this payment belongs to
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        stage_id_var := COALESCE(NEW.stage_id, 
            (SELECT ps.id FROM project_stages ps 
             INNER JOIN milestones m ON m.project_id = ps.project_id 
             WHERE m.id = NEW.milestone_id 
             LIMIT 1));
    END IF;
    
    -- Calculate total payments for this stage
    SELECT COALESCE(SUM(amount_paid), 0) INTO total_paid
    FROM payments
    WHERE stage_id = stage_id_var;
    
    -- Get stage amount
    SELECT amount INTO stage_amount
    FROM project_stages
    WHERE id = stage_id_var;
    
    -- Update stage status based on payment
    IF total_paid >= stage_amount AND stage_amount > 0 THEN
        UPDATE project_stages
        SET status = 'completed'
        WHERE id = stage_id_var;
    ELSIF total_paid > 0 THEN
        UPDATE project_stages
        SET status = 'in_progress'
        WHERE id = stage_id_var;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_stage_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_stage_payments();
```

#### Step 2.2: Add paid_amount calculation to project_stages
```sql
-- Add a computed column approach via VIEW instead
CREATE OR REPLACE VIEW project_stages_with_payments AS
SELECT 
    ps.*,
    COALESCE(SUM(p.amount_paid), 0) as paid_amount,
    GREATEST(ps.amount - COALESCE(SUM(p.amount_paid), 0), 0) as remaining_amount,
    CASE 
        WHEN ps.amount > 0 AND COALESCE(SUM(p.amount_paid), 0) >= ps.amount THEN 'fully_paid'
        WHEN COALESCE(SUM(p.amount_paid), 0) > 0 THEN 'partially_paid'
        ELSE 'unpaid'
    END as payment_status
FROM project_stages ps
LEFT JOIN payments p ON p.stage_id = ps.id
GROUP BY ps.id;
```

---

### Phase 3: Data Migration

#### Step 3.1: Map existing milestones to stages
```sql
-- For projects that have both milestones and stages,
-- we need to merge milestone data into stages based on order_index

UPDATE project_stages ps
SET 
    amount = m.amount,
    deadline = m.deadline,
    status = CASE 
        WHEN m.status = 'fully_paid' THEN 'completed'
        WHEN m.status = 'in_progress' THEN 'in_progress'
        ELSE ps.status
    END
FROM milestones m
WHERE m.project_id = ps.project_id
  AND m.order_index = ps.order_index
  AND ps.order_index > 0;
```

**Note:** This maps milestones to stages by matching `order_index`. Since stages have 6 default entries and projects may have fewer milestones, we need a smarter approach:

#### Step 3.2: Better migration - create new financial stages
```sql
-- Alternative approach: Replace workflow stages with milestone-based stages

-- For projects with milestones:
-- 1. Delete default workflow stages
-- 2. Create new stages from milestone data
-- 3. Migrate payments to reference new stages

DO $$
DECLARE
    proj RECORD;
    mile RECORD;
    new_stage_id UUID;
BEGIN
    -- Loop through all projects that have milestones
    FOR proj IN SELECT DISTINCT p.id, p.name FROM projects p
                INNER JOIN milestones m ON m.project_id = p.id
    LOOP
        -- Delete existing workflow stages for this project
        DELETE FROM project_stages WHERE project_id = proj.id;
        
        -- Create stages from milestones
        FOR mile IN SELECT * FROM milestones WHERE project_id = proj.id ORDER BY order_index
        LOOP
            INSERT INTO project_stages (
                project_id, 
                stage_name, 
                amount, 
                deadline, 
                status, 
                order_index,
                start_date
            ) VALUES (
                proj.id,
                mile.name,
                mile.amount,
                mile.deadline,
                CASE 
                    WHEN mile.status = 'fully_paid' THEN 'completed'
                    WHEN mile.status = 'in_progress' THEN 'in_progress'
                    WHEN mile.status = 'late' THEN 'in_progress'
                    ELSE 'not_started'
                END,
                mile.order_index,
                mile.created_at::date
            ) RETURNING id INTO new_stage_id;
            
            -- Migrate payments to reference this stage
            UPDATE payments 
            SET stage_id = new_stage_id
            WHERE milestone_id = mile.id;
        END LOOP;
    END LOOP;
END $$;
```

---

### Phase 4: Maintain Backward Compatibility

#### Step 4.1: Create compatibility view for old queries
```sql
-- Create a view that mimics the old milestones structure
CREATE OR REPLACE VIEW milestones_compat AS
SELECT 
    ps.id,
    ps.project_id,
    ps.stage_name as name,
    ps.amount,
    ps.deadline,
    ps.status,
    0 as late_fee_rate,
    ps.order_index,
    ps.created_at,
    ps.created_at as created_by,
    COALESCE(SUM(p.amount_paid), 0) as paid_amount,
    0 as late_fee_amount
FROM project_stages ps
LEFT JOIN payments p ON p.stage_id = ps.id
GROUP BY ps.id;
```

This allows existing code that queries `milestones` to continue working by pointing to the view instead.

---

## Rollback Plan

If issues arise, we can rollback by:

1. Remove new triggers
2. Drop new columns from project_stages
3. Restore milestone_id as required in payments
4. Revert to old milestone-based system

All changes are additive until Phase 3 (data migration), making rollback safe in early phases.

---

## Testing Checklist

- [ ] Schema changes applied without errors
- [ ] Validation trigger prevents invalid stage amounts
- [ ] Payment trigger correctly updates stage status
- [ ] Data migration preserves all existing milestone data
- [ ] Payments correctly linked to new stages
- [ ] Compatibility view returns expected data
- [ ] RLS policies still work correctly
- [ ] Activity logging continues to function
- [ ] No breaking changes to existing API queries

---

## Execution Order

1. ✅ **Step 1.1:** Add financial columns to project_stages
2. ✅ **Step 1.2:** Add stage_id to payments table
3. ✅ **Step 1.3:** Add validation trigger
4. ✅ **Step 2.1:** Create payment aggregation trigger
5. ✅ **Step 2.2:** Create project_stages_with_payments view
6. ⚠️ **Step 3.2:** Migrate milestone data to stages (CRITICAL - requires testing)
7. ✅ **Step 4.1:** Create compatibility view

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | HIGH | Backup before Phase 3, test on copy first |
| Validation trigger blocks legitimate updates | MEDIUM | Allow tolerance (0.01) for rounding |
| Payment trigger performance | LOW | Payments table is small, indexed |
| RLS policy conflicts | LOW | Using existing office-based pattern |
| Breaking existing queries | MEDIUM | Compatibility view maintains old API |

---

## Next Steps

After backend migration is complete:
1. Update `useProjectStages` hook to include financial data
2. Update ProjectStages UI to show amounts, payments, progress
3. Remove milestone UI components
4. Update documentation
5. Deprecate milestone-related code (but keep tables for now)

---

**Migration Date:** TBD  
**Estimated Downtime:** < 1 minute (all changes are online schema updates)  
**Backup Required:** YES (before Phase 3)
