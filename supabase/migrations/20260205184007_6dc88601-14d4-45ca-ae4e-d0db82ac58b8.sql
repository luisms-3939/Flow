-- Update default sidebar sections to include focus widget
ALTER TABLE public.user_settings 
ALTER COLUMN sidebar_sections_visible SET DEFAULT '{"today": true, "overdue": true, "meetings": true, "focus": true}'::jsonb;

ALTER TABLE public.user_settings 
ALTER COLUMN sidebar_sections_order SET DEFAULT ARRAY['today'::text, 'overdue'::text, 'meetings'::text, 'focus'::text];