-- Add is_primary_admin column to distinguish primary admin from sub-admins
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS is_primary_admin boolean DEFAULT false;

-- Create helper functions using existing roles
-- Check if user is primary admin (Giám đốc)
CREATE OR REPLACE FUNCTION public.is_primary_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
      AND is_primary_admin = true
  )
$$;

-- Get user department
CREATE OR REPLACE FUNCTION public.get_user_department(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Check if user can manage a specific department
CREATE OR REPLACE FUNCTION public.can_manage_department(_user_id uuid, _department text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = 'admin'
        OR (role = 'manager' AND (department = _department OR department IS NULL))
      )
  )
$$;

-- Check if user can delete records (staff cannot delete)
CREATE OR REPLACE FUNCTION public.can_delete(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager')
  )
$$;

-- Count sub-admins (max 2 allowed)
CREATE OR REPLACE FUNCTION public.count_sub_admins()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.user_roles
  WHERE role = 'admin' AND is_primary_admin = false
$$;

-- Assign admin role (only primary admin can assign)
CREATE OR REPLACE FUNCTION public.assign_sub_admin(_caller_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is primary admin
  IF NOT public.is_primary_admin(_caller_id) THEN
    RAISE EXCEPTION 'Only primary admin can assign admin roles';
  END IF;
  
  -- Check max sub-admin count (2 max)
  IF public.count_sub_admins() >= 2 THEN
    RAISE EXCEPTION 'Maximum sub-admin count reached (2)';
  END IF;
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role, is_primary_admin, assigned_by, assigned_at)
  VALUES (_target_user_id, 'admin', false, _caller_id, now())
  ON CONFLICT (user_id, role) DO UPDATE 
    SET is_primary_admin = false, 
        assigned_by = _caller_id, 
        assigned_at = now();
  
  RETURN TRUE;
END;
$$;

-- Assign manager role with department
CREATE OR REPLACE FUNCTION public.assign_manager(_caller_id uuid, _target_user_id uuid, _department text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(_caller_id) THEN
    RAISE EXCEPTION 'Only admin can assign manager roles';
  END IF;
  
  -- Insert role with department
  INSERT INTO public.user_roles (user_id, role, department, assigned_by, assigned_at)
  VALUES (_target_user_id, 'manager', _department, _caller_id, now())
  ON CONFLICT (user_id, role) DO UPDATE 
    SET department = _department,
        assigned_by = _caller_id, 
        assigned_at = now();
  
  RETURN TRUE;
END;
$$;