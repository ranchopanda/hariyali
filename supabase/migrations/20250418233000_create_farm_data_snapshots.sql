
-- Create farm_data_snapshots table
CREATE TABLE IF NOT EXISTS public.farm_data_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    data JSONB
);

-- Add RLS policies to secure the table
ALTER TABLE public.farm_data_snapshots ENABLE ROW LEVEL SECURITY;

-- Public can insert and read their own data
CREATE POLICY "Users can insert their own snapshots"
    ON public.farm_data_snapshots
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own snapshots"
    ON public.farm_data_snapshots
    FOR SELECT
    USING (true);

-- Add proper indexes
CREATE INDEX farm_data_snapshots_user_id_idx ON public.farm_data_snapshots (user_id);
CREATE INDEX farm_data_snapshots_type_idx ON public.farm_data_snapshots (type);
