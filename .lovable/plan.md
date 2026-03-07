# BẢN CHỐT TRẠNG THÁI HỆ THỐNG - Ngày 07/03/2026

> ⚠️ **CẢNH BÁO**: Toàn bộ hệ thống dưới đây đã được kiểm tra và CỐ ĐỊNH.
> KHÔNG được tự ý thay đổi bất kỳ mục nào mà không có yêu cầu rõ ràng từ người dùng.

---

## 1. MODULE BÁO CÁO & TRA CỨU (`/reports`)

### TraineeProfileView (UI Tra cứu hồ sơ 360°)
- ✅ **Không có** phần "Lớp học" (đã loại bỏ)
- ✅ **Không có** phần "Nhật ký hệ thống" / Audit Logs (đã loại bỏ)
- ✅ **Không có** phần "Địa chỉ tạm trú" (đã loại bỏ)
- ✅ Nhãn chuyên cần đầy đủ tiếng Việt:
  - `present` → "Có mặt"
  - `absent` → "Vắng"
  - `late` → "Đi trễ"
  - `excused` → "Nghỉ có phép"
  - `unexcused` → "Nghỉ không phép"
- ✅ Thông tin Công ty/Nghiệp đoàn CHỈ hiển thị cho học viên đã đậu PV
- ✅ Bảng điểm hiển thị cột "Điểm" (score/max_score) + "Đánh giá"

### Edge Function `export-trainee-pdf`
- ✅ **Đã loại bỏ** phần "Lớp học" (dòng 602: comment "ĐÃ LOẠI BỎ THEO YÊU CẦU")
- ✅ **Đã loại bỏ** phần "Nhật ký hệ thống" (dòng 881: comment "ĐÃ LOẠI BỎ THEO YÊU CẦU")
- ✅ statusLabels đầy đủ: `unexcused` → "Nghỉ không phép", `excused` → "Nghỉ có phép"
- ✅ **Đã deploy** ngày 07/03/2026

---

## 2. MODULE ĐÀO TẠO (`/education`)

### Education Dashboard
- ✅ Thống kê từ database view `education_interview_stats` (không tính toán frontend)
- ✅ Logic: "Đã đậu" = `progression_stage != 'Chưa đậu'`; "Chưa đậu" = `progression_stage IS NULL OR = 'Chưa đậu'`
- ✅ Danh sách vắng/trễ filter: `["late", "excused", "unexcused"]`
- ✅ Labels tiếng Việt: "Trễ", "Có phép", "Không phép"

### Sĩ số
- ✅ "Đang học" = có `class_id` + `departure_date IS NULL` + không thuộc giai đoạn kết thúc

---

## 3. MODULE KTX (`/dormitory`)

### DormitoryPage
- ✅ Cột **"Tình trạng PV"** hiển thị trong danh sách cư dân
- ✅ Logic: progression_stage khác 'Chưa đậu' → Badge default; ngược lại → "Chưa đậu" (secondary)
- ✅ SearchableSelect cho chuyển KTX (tìm theo Mã/Tên)
- ✅ Logic tránh trùng lặp khi chuyển đi-về cùng ngày

---

## 4. AI CHATBOT (Edge Function `ai-chat`)

### Logic truy vấn dữ liệu
- ✅ KTX: Phân tách đậu/chưa đậu từ `dormitory_residents` join `trainees.progression_stage`
- ✅ Đào tạo: Học viên đang học = `class_id NOT NULL + departure_date IS NULL + không thuộc giai đoạn kết thúc`
- ✅ Phỏng vấn (chung): `eq('progression_stage', 'Đậu phỏng vấn')` — KHÔNG tính Xuất cảnh/Bỏ trốn
- ✅ Anti-hallucination: Quy tắc chống bịa đặt ưu tiên cao nhất
- ✅ **Đã deploy** ngày 07/03/2026

---

## 5. CÁC QUY TẮC CỐ ĐỊNH

1. **SSOT (Single Source of Truth)**: Mỗi nghiệp vụ chỉ 1 nguồn dữ liệu, 1 luồng xử lý
2. **Brain/Hands**: Supabase = logic; Lovable = UI hiển thị
3. **Export đồng bộ**: Mọi cột mới trên UI phải cập nhật ngay vào `export-configs.ts`
4. **Edge Function**: Phải deploy sau khi sửa code, nếu không thay đổi không có hiệu lực
5. **Tầm nhìn 20 năm**: Kiến trúc cho 40.000+ học viên, 50+ user đồng thời

---

## 6. DATABASE VIEWS ĐÃ CHỐT

- `education_interview_stats`: Đếm đậu/chưa đậu PV theo giới tính (đã sửa logic ngày 07/03)
- `dashboard_education_total`: Tổng sĩ số đang học
- `dormitories_with_occupancy`: KTX kèm số người ở hiện tại
- `education_stats`: Tổng giáo viên/lớp học

---

*Bản chốt này là tài liệu tham chiếu để đảm bảo không có regression trong tương lai.*
