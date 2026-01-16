-- 1. Set first admin as primary admin
UPDATE public.user_roles 
SET is_primary_admin = true 
WHERE role = 'admin' 
AND id = (SELECT id FROM public.user_roles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1);

-- 2. Create user_sessions table to track online users
CREATE TABLE public.user_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_sessions (only admins can view all)
CREATE POLICY "Admins can view all sessions" 
ON public.user_sessions 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own session" 
ON public.user_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- 3. Create audit_logs table for change history
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    description TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs (only admins can view)
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Create edit_permissions table for staff edit requests
CREATE TABLE public.edit_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.edit_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own edit permissions" 
ON public.edit_permissions 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can request edit permissions" 
ON public.edit_permissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers and admins can update edit permissions" 
ON public.edit_permissions 
FOR UPDATE 
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

-- 5. Function to check if staff can edit a record (same day or has permission)
CREATE OR REPLACE FUNCTION public.can_staff_edit(_user_id UUID, _table_name TEXT, _record_id TEXT, _record_created_at TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role app_role;
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
    
    -- Admins and managers can always edit
    IF user_role IN ('admin', 'manager') THEN
        RETURN TRUE;
    END IF;
    
    -- Teachers can edit their own data
    IF user_role = 'teacher' THEN
        RETURN TRUE;
    END IF;
    
    -- Staff can only edit records created today
    IF user_role = 'staff' THEN
        -- Check if record was created today
        IF DATE(_record_created_at) = CURRENT_DATE THEN
            RETURN TRUE;
        END IF;
        
        -- Check if there's an approved edit permission
        IF EXISTS (
            SELECT 1 FROM public.edit_permissions
            WHERE user_id = _user_id
            AND table_name = _table_name
            AND record_id = _record_id
            AND status = 'approved'
            AND (expires_at IS NULL OR expires_at > now())
        ) THEN
            RETURN TRUE;
        END IF;
        
        RETURN FALSE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 6. Function to log audit
CREATE OR REPLACE FUNCTION public.log_audit(
    _action TEXT,
    _table_name TEXT,
    _record_id TEXT,
    _old_data JSONB,
    _new_data JSONB,
    _description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data, description)
    VALUES (auth.uid(), _action, _table_name, _record_id, _old_data, _new_data, _description)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;