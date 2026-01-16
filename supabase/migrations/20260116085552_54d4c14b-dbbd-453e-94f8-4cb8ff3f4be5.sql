-- Xóa các session cũ, chỉ giữ lại session mới nhất cho mỗi user
DELETE FROM public.user_sessions a
USING public.user_sessions b
WHERE a.user_id = b.user_id
AND a.last_seen_at < b.last_seen_at;

-- Thêm unique constraint trên user_id
ALTER TABLE public.user_sessions
ADD CONSTRAINT user_sessions_user_id_key UNIQUE (user_id);