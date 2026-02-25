
-- 1. Thêm menu AI vào bảng menus (để phân quyền)
INSERT INTO menus (key, label, parent_key, path, icon, order_index)
VALUES ('ai_assistant', 'Trợ lý AI', NULL, '#ai', 'Bot', 99);

-- 2. Bảng lưu lịch sử hội thoại
CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Mỗi người chỉ xem được tin nhắn của mình
CREATE POLICY "ai_chat_select" ON ai_chat_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ai_chat_insert" ON ai_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_chat_delete" ON ai_chat_messages
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Index
CREATE INDEX idx_ai_chat_user_session ON ai_chat_messages(user_id, session_id, created_at);
