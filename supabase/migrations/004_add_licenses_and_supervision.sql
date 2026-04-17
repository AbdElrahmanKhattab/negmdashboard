-- 1. Supervision System Fields
-- Add to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_supervised BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add to project_stages
ALTER TABLE project_stages ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Recreate view to include the new column
DROP VIEW IF EXISTS project_stages_with_payments;
CREATE VIEW project_stages_with_payments AS
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


-- 2. Licenses System
-- Ensure project_licenses has type column (it likely does based on the old hook)
-- Clean duplicate legacy data: Keep the latest record for each (project_id, type)
DELETE FROM project_licenses
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, type) id
  FROM project_licenses
  ORDER BY project_id, type, created_at DESC
);

-- Safely add the UNIQUE constraint
ALTER TABLE project_licenses DROP CONSTRAINT IF EXISTS project_licenses_project_id_type_key;
ALTER TABLE project_licenses ADD CONSTRAINT project_licenses_project_id_type_key UNIQUE(project_id, type);

-- Trigger for auto-creating mandatory licenses
CREATE OR REPLACE FUNCTION auto_create_mandatory_licenses()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert Survey License
  INSERT INTO project_licenses (project_id, type, request_number, status, created_by)
  VALUES (NEW.id, 'survey', NULL, 'pending', NEW.created_by)
  ON CONFLICT (project_id, type) DO NOTHING;

  -- Insert Demolition License
  INSERT INTO project_licenses (project_id, type, request_number, status, created_by)
  VALUES (NEW.id, 'demolition', NULL, 'pending', NEW.created_by)
  ON CONFLICT (project_id, type) DO NOTHING;

  -- Insert Building License
  INSERT INTO project_licenses (project_id, type, request_number, status, created_by)
  VALUES (NEW.id, 'building', NULL, 'pending', NEW.created_by)
  ON CONFLICT (project_id, type) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_create_mandatory_licenses ON projects;
CREATE TRIGGER trg_auto_create_mandatory_licenses
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION auto_create_mandatory_licenses();
