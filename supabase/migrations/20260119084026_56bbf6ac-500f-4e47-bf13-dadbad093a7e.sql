
-- Thêm SELECT policy cho union_members dựa trên quyền menu
-- User có quyền view 'internal-union' sẽ được xem dữ liệu
CREATE POLICY "union_members_select_by_menu_permission"
ON public.union_members 
FOR SELECT 
TO authenticated 
USING (can_view('internal-union'));

-- Thêm SELECT policy cho union_transactions dựa trên quyền menu
CREATE POLICY "union_transactions_select_by_menu_permission"
ON public.union_transactions 
FOR SELECT 
TO authenticated 
USING (can_view('internal-union'));
