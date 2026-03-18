-- 1. Fix is_primary_admin_check: require role = 'admin'
CREATE OR REPLACE FUNCTION public.is_primary_admin_check(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND is_primary_admin = true
      AND role = 'admin'
  )
$$;

-- 2. Prevent is_primary_admin on non-admin roles via CHECK constraint
ALTER TABLE public.user_roles
ADD CONSTRAINT chk_primary_admin_requires_admin
CHECK (is_primary_admin = false OR is_primary_admin IS NULL OR role = 'admin');