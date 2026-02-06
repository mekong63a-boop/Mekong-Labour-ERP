-- Bảng lưu thông báo đăng ký chờ phân quyền
CREATE TABLE IF NOT EXISTS public.pending_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    user_email TEXT NOT NULL,
    full_name TEXT,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    read_by UUID
);

-- Enable RLS
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- Chỉ Primary Admin mới có thể xem và quản lý
CREATE POLICY "Primary admin can view pending registrations"
ON public.pending_registrations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin' 
        AND is_primary_admin = true
    )
);

CREATE POLICY "Primary admin can update pending registrations"
ON public.pending_registrations
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin' 
        AND is_primary_admin = true
    )
);

CREATE POLICY "Primary admin can delete pending registrations"
ON public.pending_registrations
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin' 
        AND is_primary_admin = true
    )
);

-- Cho phép insert từ trigger (definer)
CREATE POLICY "System can insert pending registrations"
ON public.pending_registrations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger function để tự động thêm vào pending khi có user mới xác minh email
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Chỉ thêm nếu user đã xác minh email và chưa có role
    IF NEW.email_confirmed_at IS NOT NULL AND 
       NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
        INSERT INTO public.pending_registrations (user_id, user_email, full_name)
        VALUES (
            NEW.id, 
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', '')
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger khi user cập nhật (xác minh email)
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.handle_new_user_registration();

-- Trigger khi user tạo mới đã confirmed sẵn
DROP TRIGGER IF EXISTS on_auth_user_created_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_created_confirmed
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.handle_new_user_registration();

-- Function để xóa khỏi pending khi user được cấp quyền
CREATE OR REPLACE FUNCTION public.remove_from_pending_on_role_assign()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.pending_registrations WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$;

-- Trigger khi cấp role cho user
DROP TRIGGER IF EXISTS on_user_role_assigned ON public.user_roles;
CREATE TRIGGER on_user_role_assigned
    AFTER INSERT ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.remove_from_pending_on_role_assign();

-- RPC để lấy số lượng pending cho Primary Admin
CREATE OR REPLACE FUNCTION public.get_pending_registration_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.pending_registrations
    WHERE is_read = false
    AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin' 
        AND is_primary_admin = true
    )
$$;