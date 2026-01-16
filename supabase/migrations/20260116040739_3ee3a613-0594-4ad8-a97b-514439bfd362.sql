-- First migration: Only add new enum value and columns
-- The enum value 'super_admin' was added in previous migration

-- Add department column to user_roles for department-based permissions
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_at timestamptz DEFAULT now();