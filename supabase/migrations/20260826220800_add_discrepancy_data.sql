-- Migration to add discrepancy_data to analysis_sessions
ALTER TABLE analysis_sessions 
ADD COLUMN discrepancy_data JSONB;
