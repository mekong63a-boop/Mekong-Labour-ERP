-- Fix: Siết lại unions SELECT policy từ USING (true) sang menu-based
-- Giữ nguyên schema, chỉ thay đổi RLS policy

-- Drop policy cũ
DROP POLICY IF EXISTS "unions_select_policy" ON unions;

-- Tạo policy mới với menu-based permission
CREATE POLICY "unions_select_policy" ON unions
FOR SELECT USING (can_view('partners'));