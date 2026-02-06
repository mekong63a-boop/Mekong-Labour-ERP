-- Tạo RPC function để lấy user chờ cấp quyền (không dựa vào trigger)
CREATE OR REPLACE FUNCTION public.get_pending_users()
RETURNS TABLE (
    user_id uuid,
    user_email text,
    full_name text,
    email_confirmed_at timestamptz,
    created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        u.id as user_id,
        u.email as user_email,
        COALESCE(u.raw_user_meta_data->>'full_name', '') as full_name,
        u.email_confirmed_at,
        u.created_at
    FROM auth.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE u.email_confirmed_at IS NOT NULL
      AND ur.id IS NULL
    ORDER BY u.email_confirmed_at DESC;
$$;

-- Cập nhật function đếm số lượng pending
CREATE OR REPLACE FUNCTION public.get_pending_registration_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::integer
    FROM auth.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE u.email_confirmed_at IS NOT NULL
      AND ur.id IS NULL;
$$;