

## Kết quả rà soát toàn bộ hệ thống

### Tình trạng hiện tại: Hầu hết đã sạch

**Frontend** (`src/integrations/supabase/client.ts`):
- Đã dùng `sb_publishable_...` key mới. Không còn legacy `eyJ...`. OK.

**Edge Functions** (4 functions):
- `ai-chat`, `export-trainee-pdf`, `export-rirekisho`, `weekly-backup`: Tất cả đều dùng `Deno.env.get("SUPABASE_URL")` và `Deno.env.get("SUPABASE_ANON_KEY")` — không hardcode key. OK.
- Tất cả đều validate JWT trong code. OK.

### Vấn đề cần sửa

**1. `SYSTEM_DOCUMENTATION.md` dòng 90** — vẫn ghi `eyJhbGciOiJIUzI1NiIs...` làm ví dụ cho publishable key. Mặc dù chỉ là tài liệu, nhưng gây nhầm lẫn và vi phạm nguyên tắc không lưu legacy key trong repo.
- **Sửa**: Thay bằng `sb_publishable_...` (dạng mới, truncated).

**2. `supabase/config.toml`** — hiện chỉ có 1 dòng `project_id`. Không khai báo `verify_jwt = false` cho các Edge Functions. Theo tiêu chuẩn signing-keys mới, `verify_jwt = true` (default) không hoạt động đúng. Các function đã validate JWT trong code nên cần set explicit `verify_jwt = false`.
- **Sửa**: Thêm khai báo cho 4 functions: `ai-chat`, `export-trainee-pdf`, `export-rirekisho`, `weekly-backup`.

### Kế hoạch thực hiện

| # | File | Thay đổi |
|---|------|----------|
| 1 | `SYSTEM_DOCUMENTATION.md` | Dòng 90: đổi `eyJhbGciOiJIUzI1NiIs...` → `sb_publishable_nQkq...` |
| 2 | `supabase/config.toml` | Thêm `[functions.*]` blocks với `verify_jwt = false` cho 4 functions |

Không cần sửa bất kỳ Edge Function code hay frontend code nào khác — tất cả đã đúng chuẩn.

