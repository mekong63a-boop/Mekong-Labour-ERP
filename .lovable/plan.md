

## Cập nhật Supabase Client với Publishable Key mới

### Tình trạng hiện tại
- Secret `PUBLISHABLE_KEY` đã được tạo trong Lovable với giá trị: `sb_publishable_nQkqreudsHeEhvFbczMJuw_NdUaoXcQ`
- File `src/integrations/supabase/client.ts` đang hardcoded với legacy key cũ (dòng 6)
- App đang gặp lỗi 401 vì legacy keys đã bị disable

### Kế hoạch thực hiện

**Bước 1**: Cập nhật `src/integrations/supabase/client.ts`
- Thay thế `SUPABASE_PUBLISHABLE_KEY` từ legacy key sang key mới: `sb_publishable_nQkqreudsHeEhvFbczMJuw_NdUaoXcQ`
- Giữ nguyên `SUPABASE_URL` (không thay đổi)

**Bước 2**: (Optional) Sử dụng biến môi trường thay vì hardcode
- Thay vì hardcode, có thể đọc từ `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` 
- Nhưng theo memory "supabase-client-config", hệ thống yêu cầu hardcode để tránh lỗi production

**Bước 3**: Kiểm tra lại sau khi update
- Test đăng nhập
- Test các API calls cơ bản

### Chi tiết thay đổi code

File: `src/integrations/supabase/client.ts`

```typescript
// Từ:
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Sang:
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nQkqreudsHeEhvFbczMJuw_NdUaoXcQ";
```

