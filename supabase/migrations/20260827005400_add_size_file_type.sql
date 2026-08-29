-- Add size and file_type columns to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS size INTEGER,
ADD COLUMN IF NOT EXISTS file_type TEXT;
