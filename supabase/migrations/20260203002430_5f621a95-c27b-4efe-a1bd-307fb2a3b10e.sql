-- Drop the existing type check constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;

-- Add the updated constraint that includes "birthday"
ALTER TABLE public.events ADD CONSTRAINT events_type_check 
CHECK (type IN ('task', 'note', 'meeting', 'birthday'));