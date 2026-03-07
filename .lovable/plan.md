

# Cập nhật System Prompt cho AI Mekong

## Mục tiêu
Nâng cấp system prompt để AI trở thành chuyên gia về quản lý lao động xuất khẩu Nhật Bản, hiểu rõ quy trình đào tạo và xuất cảnh của công ty Mekong, và **luôn trả lời bằng tiếng Việt**.

## Thay đổi

### File: `supabase/functions/ai-chat/index.ts`
Thay thế `SYSTEM_PROMPT` hiện tại (dòng 9-27) bằng prompt chi tiết hơn, bao gồm:

1. **Vai trò**: Chuyên gia quản lý lao động xuất khẩu Nhật Bản tại công ty Mekong
2. **Ngôn ngữ**: Luôn trả lời bằng tiếng Việt (bắt buộc, không ngoại lệ)
3. **Quy trình đào tạo chi tiết**:
   - Tuyển dụng → Sơ tuyển → Đào tạo tiếng Nhật & kỹ năng → Phỏng vấn đơn hàng → Trúng tuyển → Xử lý hồ sơ pháp lý (OTIT, Nyukan, COE, Visa) → Xuất cảnh → Theo dõi tại Nhật
4. **Kiến thức chuyên sâu**: Chế độ kỹ năng đặc định, thực tập sinh kỹ năng, luật lao động Nhật, quy định OTIT, nghiệp đoàn, quyền lợi học viên
5. **Hướng dẫn sử dụng hệ thống**: Biết các menu và chức năng trong ERP để hướng dẫn người dùng
6. **Quy tắc**: Không tiết lộ PII, trả lời ngắn gọn thực tế, gợi ý đúng chức năng hệ thống

Sau khi cập nhật, sẽ deploy lại edge function.

