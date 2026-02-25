

## Tich hop Tro ly AI (Google Gemini) vao he thong Mekong Labour ERP

### Tong quan
Them nut chat noi o goc duoi ben phai man hinh, cho phep nguoi dung hoi AI ve thong tin hoc vien, thong ke, huong dan su dung he thong. Quyen su dung AI duoc kiem soat qua he thong phan quyen menu hien tai.

### Yeu cau truoc khi bat dau
Ban can tao API key Google Gemini mien phi tai [Google AI Studio](https://aistudio.google.com/apikeys), sau do toi se luu vao he thong dang secret an toan.

---

### Phan 1: Database - Them menu "ai_assistant" va bang luu lich su chat

**Migration SQL:**

```sql
-- 1. Them menu AI vao bang menus (de phan quyen)
INSERT INTO menus (key, label, parent_key, path, icon, order_index)
VALUES ('ai_assistant', 'Tro ly AI', NULL, '#ai', 'Bot', 99);

-- 2. Bang luu lich su hoi thoai
CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Moi nguoi chi xem duoc tin nhan cua minh
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
```

**Luu y:** Menu `ai_assistant` co `path: '#ai'` (khong phai trang rieng) va `order_index: 99` de khong anh huong menu hien tai. Menu nay CHI dung cho viec phan quyen (can_view), khong hien thi tren sidebar.

---

### Phan 2: Edge Function - `ai-chat`

Tao file `supabase/functions/ai-chat/index.ts`:
- Nhan tin nhan tu nguoi dung + lich su hoi thoai
- Goi Google Gemini API (`gemini-2.0-flash`)
- Xac thuc JWT trong code (verify_jwt = false trong config.toml)
- Kiem tra quyen menu `ai_assistant` bang cach goi RPC `has_menu_permission`
- Tra ve response streaming hoac JSON

System prompt se huong dan AI ve ngu canh he thong Mekong Labour ERP (quan ly hoc vien, giai doan, KTX, dao tao...) de tra loi chinh xac hon.

---

### Phan 3: Frontend

**A. Component `AIChatWidget` (`src/components/ai/AIChatWidget.tsx`):**
- Nut tron noi o goc duoi phai (position fixed, z-index 50)
- Icon: Bot (lucide-react)
- Click mo hop chat (panel nho 400x500px)
- Gom: input, danh sach tin nhan (scroll), nut gui, nut xoa lich su
- Render markdown cho cau tra loi AI (dung ReactMarkdown neu co, hoac dangerouslySetInnerHTML don gian)
- Luu lich su vao bang `ai_chat_messages` qua Supabase client
- Goi edge function `ai-chat` de lay cau tra loi

**B. Kiem tra quyen (`src/components/ai/AIChatWidget.tsx`):**
- Dung `useCanAccessMenu('ai_assistant')` de kiem tra quyen
- Neu `canView = false` va khong phai Primary Admin → an nut hoan toan
- Khong can route moi, khong can trang rieng

**C. Tich hop vao `MainLayout.tsx`:**
- Them `<AIChatWidget />` vao cuoi component MainLayout, ngay truoc the dong `</div>`
- Vi tri: sau `<main>`, truoc `</div>` ngoai cung
- Khong thay doi bat ky UI hien tai nao

---

### Phan 4: Phan quyen

| Vai tro | Quyen |
|---------|-------|
| Primary Admin | Luon thay va su dung AI |
| Admin phu / Manager / Staff | Chi khi duoc cap quyen `can_view` cho menu `ai_assistant` |
| Chua phan quyen | Khong thay |

Admin chinh vao trang **Quan tri > Phan quyen nguoi dung** hoac **Phan quyen phong ban**, tick "Xem" cho muc "Tro ly AI" de cap quyen cho tung nguoi/phong ban.

---

### Dam bao quy tac

| Quy tac | Tuan thu |
|---------|----------|
| Single Source of Truth | Quyen AI nam trong `user_menu_permissions` / `department_menu_permissions` - cung 1 he thong phan quyen |
| Brain vs Hands | Logic phan quyen + luu lich su nam trong Supabase (RLS + RPC). Frontend chi hien thi |
| Khong pha UI | Chi them 1 nut noi fixed, khong thay doi layout/sidebar/header hien tai |
| 1 luong duy nhat | Luong: User gui tin → Edge function kiem tra quyen + goi Gemini → tra ve → hien thi |

---

### Danh sach file thay doi

| File | Hanh dong | Noi dung |
|------|-----------|---------|
| `supabase/migrations/xxx.sql` | Tao moi | Them menu `ai_assistant`, tao bang `ai_chat_messages` + RLS |
| `supabase/config.toml` | Sua | Them `[functions.ai-chat]` verify_jwt = false |
| `supabase/functions/ai-chat/index.ts` | Tao moi | Edge function goi Google Gemini API |
| `src/components/ai/AIChatWidget.tsx` | Tao moi | Component chat noi |
| `src/components/layout/MainLayout.tsx` | Sua | Them `<AIChatWidget />` |

