-- Create diaper_changes table
CREATE TABLE IF NOT EXISTS public.diaper_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('wet', 'dirty', 'both')),
    brand TEXT,
    size TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS diaper_changes_user_id_idx ON public.diaper_changes(user_id);

-- Create index on timestamp for faster sorting
CREATE INDEX IF NOT EXISTS diaper_changes_timestamp_idx ON public.diaper_changes(timestamp);

-- Enable Row Level Security
ALTER TABLE public.diaper_changes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own diaper changes
CREATE POLICY "Users can view their own diaper changes"
    ON public.diaper_changes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own diaper changes
CREATE POLICY "Users can insert their own diaper changes"
    ON public.diaper_changes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own diaper changes
CREATE POLICY "Users can update their own diaper changes"
    ON public.diaper_changes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own diaper changes
CREATE POLICY "Users can delete their own diaper changes"
    ON public.diaper_changes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_diaper_changes_updated_at
    BEFORE UPDATE ON public.diaper_changes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 