-- Migration: 001_create_project_stages.sql
-- Description: Create project_stages table with RLS policies

-- Create project_stages table
CREATE TABLE IF NOT EXISTS project_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    stage_name text NOT NULL,
    status text CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    request_number text,
    notes text,
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz
);

-- Create indexes for performance
CREATE INDEX idx_project_stages_project_id ON project_stages(project_id);
CREATE INDEX idx_project_stages_order_index ON project_stages(project_id, order_index);

-- Enable Row Level Security
ALTER TABLE project_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_stages
-- Owners have full access (via their office)
CREATE POLICY "Owners can view stages via office access"
    ON project_stages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_stages.project_id
            AND p.office_id IN (
                SELECT o.id FROM offices o
                INNER JOIN users u ON u.office_id = o.id
                WHERE u.id = auth.uid()
                AND u.role = 'owner'
            )
        )
    );

CREATE POLICY "Owners can insert stages via office access"
    ON project_stages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_stages.project_id
            AND p.office_id IN (
                SELECT o.id FROM offices o
                INNER JOIN users u ON u.office_id = o.id
                WHERE u.id = auth.uid()
                AND u.role = 'owner'
            )
        )
    );

CREATE POLICY "Owners can update stages via office access"
    ON project_stages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_stages.project_id
            AND p.office_id IN (
                SELECT o.id FROM offices o
                INNER JOIN users u ON u.office_id = o.id
                WHERE u.id = auth.uid()
                AND u.role = 'owner'
            )
        )
    );

CREATE POLICY "Owners can delete stages via office access"
    ON project_stages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_stages.project_id
            AND p.office_id IN (
                SELECT o.id FROM offices o
                INNER JOIN users u ON u.office_id = o.id
                WHERE u.id = auth.uid()
                AND u.role = 'owner'
            )
        )
    );

-- Accountants have read-only access (via their office)
CREATE POLICY "Accountants can view stages via office access"
    ON project_stages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_stages.project_id
            AND p.office_id IN (
                SELECT o.id FROM offices o
                INNER JOIN users u ON u.office_id = o.id
                WHERE u.id = auth.uid()
                AND u.role = 'accountant'
            )
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_stages_updated_at
    BEFORE UPDATE ON project_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
