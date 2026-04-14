-- Migration: 003_create_stage_triggers.sql
-- Description: Create triggers for auto-generating stages and activity logging

-- Function to auto-generate default stages when a project is created
CREATE OR REPLACE FUNCTION generate_default_stages()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default stages in order
    INSERT INTO project_stages (project_id, stage_name, order_index) VALUES
    (NEW.id, 'رخصة البناء', 1),
    (NEW.id, 'الاشتراطات', 2),
    (NEW.id, 'التصحيح', 3),
    (NEW.id, 'الفرز', 4),
    (NEW.id, 'الإشغال', 5),
    (NEW.id, 'تنفيذ المشروع', 6);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate stages after project insertion
CREATE TRIGGER generate_default_stages_after_insert
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION generate_default_stages();

-- Function to log stage changes to activity_log
CREATE OR REPLACE FUNCTION log_stage_activity()
RETURNS TRIGGER AS $$
DECLARE
    user_id uuid;
    action text;
    metadata jsonb;
BEGIN
    -- Get the current user ID (from auth)
    user_id := auth.uid();
    
    -- Determine the action type
    IF (TG_OP = 'INSERT') THEN
        action := 'stage_created';
        metadata := jsonb_build_object(
            'stage_name', NEW.stage_name,
            'order_index', NEW.order_index
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Check if status changed
        IF (OLD.status != NEW.status) THEN
            action := 'stage_status_changed';
            metadata := jsonb_build_object(
                'stage_name', NEW.stage_name,
                'from_status', OLD.status,
                'to_status', NEW.status
            );
        ELSE
            action := 'stage_updated';
            metadata := jsonb_build_object(
                'stage_name', NEW.stage_name,
                'changes', 'notes or request_number updated'
            );
        END IF;
    END IF;
    
    -- Insert into activity_log
    INSERT INTO activity_log (
        office_id,
        project_id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        (SELECT office_id FROM projects WHERE id = NEW.project_id),
        NEW.project_id,
        user_id,
        action,
        'project_stage',
        NEW.id,
        metadata
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stage activity logging
CREATE TRIGGER log_stage_activity_after_change
    AFTER INSERT OR UPDATE ON project_stages
    FOR EACH ROW
    EXECUTE FUNCTION log_stage_activity();

-- Function to log stage document changes
CREATE OR REPLACE FUNCTION log_stage_document_activity()
RETURNS TRIGGER AS $$
DECLARE
    user_id uuid;
    action text;
    metadata jsonb;
    project_id uuid;
BEGIN
    -- Get the current user ID (from auth)
    user_id := auth.uid();
    
    -- Get the project_id from the stage
    SELECT ps.project_id INTO project_id
    FROM project_stages ps
    WHERE ps.id = NEW.stage_id;
    
    -- Determine the action type
    IF (TG_OP = 'INSERT') THEN
        action := 'stage_document_uploaded';
        metadata := jsonb_build_object(
            'file_url', NEW.file_url,
            'type', NEW.type
        );
    ELSIF (TG_OP = 'DELETE') THEN
        action := 'stage_document_deleted';
        metadata := jsonb_build_object(
            'file_url', OLD.file_url
        );
    END IF;
    
    -- Insert into activity_log
    INSERT INTO activity_log (
        office_id,
        project_id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        (SELECT office_id FROM projects WHERE id = project_id),
        project_id,
        user_id,
        action,
        'stage_document',
        NEW.id,
        metadata
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stage document activity logging
CREATE TRIGGER log_stage_document_activity_after_change
    AFTER INSERT OR DELETE ON stage_documents
    FOR EACH ROW
    EXECUTE FUNCTION log_stage_document_activity();
