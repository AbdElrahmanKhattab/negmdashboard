-- Migration: 002_create_stage_documents.sql
-- Description: Create stage_documents table with RLS policies

-- Create stage_documents table
CREATE TABLE IF NOT EXISTS stage_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id uuid REFERENCES project_stages(id) ON DELETE CASCADE NOT NULL,
    file_url text NOT NULL,
    type text,
    uploaded_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_stage_documents_stage_id ON stage_documents(stage_id);

-- Enable Row Level Security
ALTER TABLE stage_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stage_documents
-- Owners have full access (via their office)
CREATE POLICY "Owners can view stage documents via office access"
    ON stage_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_stages ps
            INNER JOIN projects p ON p.id = ps.project_id
            WHERE ps.id = stage_documents.stage_id
            AND p.office_id IN (
                SELECT o.id FROM offices o
                INNER JOIN users u ON u.office_id = o.id
                WHERE u.id = auth.uid()
                AND u.role = 'owner'
            )
        )
    );

CREATE POLICY "Owners can insert stage documents via office access"
    ON stage_documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_stages ps
            INNER JOIN projects p ON p.id = ps.project_id
            WHERE ps.id = stage_documents.stage_id
            AND p.office_id IN (
                SELECT o.id FROM offices o
                INNER JOIN users u ON u.office_id = o.id
                WHERE u.id = auth.uid()
                AND u.role = 'owner'
            )
        )
    );

CREATE POLICY "Owners can delete stage documents via office access"
    ON stage_documents
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM project_stages ps
            INNER JOIN projects p ON p.id = ps.project_id
            WHERE ps.id = stage_documents.stage_id
            AND p.office_id IN (
                SELECT o.id FROM offices o
                INNER JOIN users u ON u.office_id = o.id
                WHERE u.id = auth.uid()
                AND u.role = 'owner'
            )
        )
    );

-- Accountants have read-only access (via their office)
CREATE POLICY "Accountants can view stage documents via office access"
    ON stage_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_stages ps
            INNER JOIN projects p ON p.id = ps.project_id
            WHERE ps.id = stage_documents.stage_id
            AND p.office_id IN (
                SELECT o.id FROM offices o
                INNER JOIN users u ON u.office_id = o.id
                WHERE u.id = auth.uid()
                AND u.role = 'accountant'
            )
        )
    );
