-- Add sidebar_collapsed column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS sidebar_collapsed BOOLEAN NOT NULL DEFAULT false;