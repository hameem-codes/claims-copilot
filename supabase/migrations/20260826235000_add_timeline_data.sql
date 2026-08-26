-- Migration to add timeline_data to analysis_sessions
ALTER TABLE analysis_sessions 
ADD COLUMN timeline_data JSONB;
