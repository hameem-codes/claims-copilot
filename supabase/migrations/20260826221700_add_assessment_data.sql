-- Migration to add assessment_data to analysis_sessions
ALTER TABLE analysis_sessions 
ADD COLUMN assessment_data JSONB;
