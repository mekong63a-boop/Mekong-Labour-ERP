
Mục tiêu: chấm dứt lỗi `Legacy API keys are disabled` mà không thay đổi logic nghiệp vụ nào khác.

1) Kết quả khám phá (đã xác nhận)
- `src/integrations/supabase/client.ts` hiện đang dùng:
  - `SUPABASE_URL = https://bcltzwpnhfpbfiuhfkxi.supabase.co`
  - `SUPABASE_PUBLISHABLE_KEY = eyJ...` (legacy anon JWT key)
- Network logs cho thấy mọi request đều gửi header `apikey: eyJ...` và bị 401 với thông báo:
  - `"Legacy API keys are disabled"`
- Toàn bộ app dùng chung client này, nên khi key sai thì tất cả auth/rpc/rest đều fail đồng loạt (đúng như ảnh bạn gửi).

2) Nguyên nhân gốc (vì sao “lại bị nữa”)
- File `client.ts` là file “automatically generated”, nên nếu nguồn cấu hình integration vẫn giữ key cũ thì file sẽ tiếp tục được regenerate về `eyJ...`.
- Vì legacy key đã bị tắt trong Supabase, app sẽ lặp lại lỗi ngay cả khi UI/logic không đổi.

3) Kế hoạch xử lý (chỉ xử lý key, KHÔNG đụng phần khác)
- Bước 1: Cập nhật Supabase integration settings của project để dùng **publishable key mới đang active** (dạng Supabase hiện hành), không dùng legacy `eyJ...`.
- Bước 2: Regenerate lại `src/integrations/supabase/client.ts` từ integration (không chỉnh tay các module khác).
- Bước 3: Xác nhận sau regenerate:
  - `SUPABASE_PUBLISHABLE_KEY` trong `client.ts` đã đổi khỏi `eyJ...`
  - Không còn chuỗi legacy key trong codebase.
- Bước 4: Hard refresh preview + đăng nhập lại để đảm bảo bundle mới được nạp.

4) Tiêu chí hoàn tất
- Network request tới `auth/v1`, `rest/v1`, `rpc/*` không còn gửi `apikey: eyJ...`.
- Không còn lỗi toast `Legacy API keys are disabled`.
- Login hoạt động bình thường, các truy vấn role/session/rpc trả về 200 thay vì 401.

5) Chi tiết kỹ thuật (để đối chiếu nhanh)
- Điểm nghẽn hiện tại nằm ở đúng 1 chỗ nguồn: `src/integrations/supabase/client.ts` (key cũ).
- Các file như `useAuth.ts`, `Login.tsx`, `useSessionHeartbeat.ts`, `AIChatWidget.tsx`, `ReportsPage.tsx`, `TraineeDetail.tsx` đều phụ thuộc key này nên không cần sửa riêng từng file nếu regenerate đúng client.
