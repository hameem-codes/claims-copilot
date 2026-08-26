-- Migration to add comparison_data to analysis_sessions
ALTER TABLE analysis_sessions 
ADD COLUMN comparison_data JSONB;
