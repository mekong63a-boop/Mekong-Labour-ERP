-- Fix 4: Chuyển trainee_reviews RLS từ role-based sang menu-based
-- Giữ nguyên schema, chỉ thay đổi policies

-- Drop các policy cũ (role-based)
DROP POLICY IF EXISTS "Staff and above can manage trainee_reviews" ON trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_select" ON trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_insert" ON trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_update" ON trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_delete" ON trainee_reviews;
DROP POLICY IF EXISTS "Teachers and staff can view reviews" ON trainee_reviews;
DROP POLICY IF EXISTS "Teachers and staff can insert reviews" ON trainee_reviews;
DROP POLICY IF EXISTS "Teachers and staff can update reviews" ON trainee_reviews;
DROP POLICY IF EXISTS "Managers can delete reviews" ON trainee_reviews;

-- Tạo policy mới dùng menu-based (education menu)
CREATE POLICY "trainee_reviews_select_menu" ON trainee_reviews
FOR SELECT USING (can_view('education'));

CREATE POLICY "trainee_reviews_insert_menu" ON trainee_reviews
FOR INSERT WITH CHECK (can_insert('education'));

CREATE POLICY "trainee_reviews_update_menu" ON trainee_reviews
FOR UPDATE USING (can_update('education'));

CREATE POLICY "trainee_reviews_delete_menu" ON trainee_reviews
FOR DELETE USING (can_delete('education'));