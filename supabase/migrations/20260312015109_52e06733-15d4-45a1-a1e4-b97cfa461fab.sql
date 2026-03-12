
-- MIGRATION 1/2: Rename enum values + Add new values
-- ===================== progression_stage =====================
ALTER TYPE public.progression_stage RENAME VALUE 'Chưa đậu' TO 'ChuaDau';
ALTER TYPE public.progression_stage RENAME VALUE 'Nộp hồ sơ' TO 'NopHS';
ALTER TYPE public.progression_stage RENAME VALUE 'Đậu phỏng vấn' TO 'DauPV';
ALTER TYPE public.progression_stage RENAME VALUE 'Xuất cảnh' TO 'DaXuatCanh';
ALTER TYPE public.progression_stage RENAME VALUE 'Đang làm việc' TO 'DangLamViec';
ALTER TYPE public.progression_stage RENAME VALUE 'Về trước hạn' TO 'VeNuocSom';
ALTER TYPE public.progression_stage RENAME VALUE 'Hoàn thành hợp đồng' TO 'HoanThanhHD';
ALTER TYPE public.progression_stage RENAME VALUE 'Bỏ trốn' TO 'BoTron';
ALTER TYPE public.progression_stage ADD VALUE IF NOT EXISTS 'DaoTao';

-- ===================== simple_status =====================
ALTER TYPE public.simple_status RENAME VALUE 'Đăng ký mới' TO 'DangKyMoi';
ALTER TYPE public.simple_status RENAME VALUE 'Đang học' TO 'DangHoc';
ALTER TYPE public.simple_status RENAME VALUE 'Bảo lưu' TO 'BaoLuu';
ALTER TYPE public.simple_status RENAME VALUE 'Dừng chương trình' TO 'DungChuongTrinh';
ALTER TYPE public.simple_status RENAME VALUE 'Không học' TO 'KhongHoc';
ALTER TYPE public.simple_status RENAME VALUE 'Hủy' TO 'Huy';
ALTER TYPE public.simple_status RENAME VALUE 'Đang ở Nhật' TO 'DangONhat';
ALTER TYPE public.simple_status RENAME VALUE 'Rời công ty' TO 'RoiCongTy';
ALTER TYPE public.simple_status ADD VALUE IF NOT EXISTS 'DaDau';

-- ===================== trainee_type =====================
ALTER TYPE public.trainee_type RENAME VALUE 'Thực tập sinh' TO 'TTS';
ALTER TYPE public.trainee_type RENAME VALUE 'Kỹ năng đặc định' TO 'KyNang';
ALTER TYPE public.trainee_type RENAME VALUE 'Kỹ sư' TO 'KySu';
ALTER TYPE public.trainee_type RENAME VALUE 'Du học sinh' TO 'DuHoc';
ALTER TYPE public.trainee_type RENAME VALUE 'Thực tập sinh số 3' TO 'TTS3';
