-- ============================================
-- SECURITY HARDENING: Hoàn tất bảo mật
-- ============================================

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create security audit trigger for sensitive tables
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, description)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      TG_OP,
      TG_TABLE_NAME,
      OLD.id::TEXT,
      to_jsonb(OLD),
      'Xóa bản ghi từ bảng ' || TG_TABLE_NAME
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data, description)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id::TEXT,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'Cập nhật bản ghi trong bảng ' || TG_TABLE_NAME
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data, description)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id::TEXT,
      to_jsonb(NEW),
      'Thêm mới bản ghi vào bảng ' || TG_TABLE_NAME
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Apply audit trigger to critical tables
DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

DROP TRIGGER IF EXISTS audit_trainees_changes ON public.trainees;
CREATE TRIGGER audit_trainees_changes
AFTER INSERT OR UPDATE OR DELETE ON public.trainees
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

DROP TRIGGER IF EXISTS audit_orders_changes ON public.orders;
CREATE TRIGGER audit_orders_changes
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();