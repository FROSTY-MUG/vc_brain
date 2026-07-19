-- Run this in your Supabase SQL Editor to create the founder_scores_history table.
-- Go to: https://supabase.com/dashboard/project/kptduemqrdpahjsfomhb/sql

CREATE TABLE IF NOT EXISTS founder_scores_history (
    id TEXT PRIMARY KEY,
    founder_id TEXT NOT NULL,
    base_score INTEGER NOT NULL,
    confidence_margin INTEGER NOT NULL,
    justification TEXT,
    recorded_timestamp BIGINT NOT NULL
);

-- Enable Row Level Security (RLS) but allow all reads/writes via service key
ALTER TABLE founder_scores_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access via service key"
ON founder_scores_history
FOR ALL
USING (true)
WITH CHECK (true);
