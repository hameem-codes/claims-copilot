-- Create analysis_sessions table
CREATE TABLE IF NOT EXISTS analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  policy_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  claim_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analysis_sessions
CREATE POLICY "Users can view own analysis sessions" 
ON analysis_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis sessions" 
ON analysis_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis sessions" 
ON analysis_sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis sessions" 
ON analysis_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analysis_sessions_modtime
BEFORE UPDATE ON analysis_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
