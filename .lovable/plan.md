

## Dọn dẹp tính năng Quét CCCD (Dead Code)

### Vấn đề
- `src/components/trainees/CCCDScanner.tsx` không được import ở bất kỳ file nào
- `supabase/functions/scan-cccd/` Edge Function tồn tại nhưng không còn ai gọi
- Cả hai chiếm dung lượng và gây nhầm lẫn khi bảo trì

### Kế hoạch thực hiện

**Bước 1**: Xóa file `src/components/trainees/CCCDScanner.tsx`

**Bước 2**: Xóa Edge Function `scan-cccd` (xóa thư mục `supabase/functions/scan-cccd/` và xóa config trong `supabase/config.toml`)

**Bước 3**: Deploy lệnh xóa Edge Function trên Supabase (delete deployed function)

**Bước 4**: Cập nhật `SYSTEM_DOCUMENTATION.md` để loại bỏ tham chiếu đến CCCDScanner

