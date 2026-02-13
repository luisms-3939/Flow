-- Add widget customization columns to user_settings table
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS sidebar_sections_order TEXT[] DEFAULT ARRAY['today', 'overdue', 'meetings'],
ADD COLUMN IF NOT EXISTS sidebar_sections_visible JSONB DEFAULT '{"today": true, "overdue": true, "meetings": true}'::jsonb,
ADD COLUMN IF NOT EXISTS sidebar_width INTEGER DEFAULT 320,
ADD COLUMN IF NOT EXISTS preview_pane_visible BOOLEAN DEFAULT true;