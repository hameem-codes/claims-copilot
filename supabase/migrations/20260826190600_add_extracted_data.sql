-- Add JSONB columns to analysis_sessions for fact extraction
ALTER TABLE analysis_sessions 
ADD COLUMN policy_extracted_data JSONB,
ADD COLUMN claim_extracted_data JSONB;
