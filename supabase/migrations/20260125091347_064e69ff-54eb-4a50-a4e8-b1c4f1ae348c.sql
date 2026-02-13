-- Add attachments column to events table
ALTER TABLE public.events
ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;