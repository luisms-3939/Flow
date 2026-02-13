-- Add status field for tasks (to support Kanban: todo, in_progress, done)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status text DEFAULT 'todo';

-- Add a check constraint to ensure valid status values
ALTER TABLE public.events ADD CONSTRAINT events_status_check 
  CHECK (status IN ('todo', 'in_progress', 'done') OR status IS NULL);