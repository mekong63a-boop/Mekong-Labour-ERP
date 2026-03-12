// =============================================================================
// ENUM LABEL MAPPING: Slug → Vietnamese Display Labels
// SOURCE OF TRUTH cho hiển thị nhãn tiếng Việt trên toàn bộ Frontend
// Database lưu mã slug, Frontend hiển thị nhãn qua file này
// =============================================================================

// progression_stage labels
export const PROGRESSION_STAGE_LABELS: Record<string, string> = {
  ChuaDau: 'Chưa đậu',
  DauPV: 'Đậu phỏng vấn',
  NopHS: 'Nộp hồ sơ',
  OTIT: 'OTIT',
  Nyukan: 'Nyukan',
  COE: 'COE',
  Visa: 'Visa',
  DaoTao: 'Đào tạo',
  DaXuatCanh: 'Xuất cảnh',
  DangLamViec: 'Đang làm việc',
  BoTron: 'Bỏ trốn',
  VeNuocSom: 'Về trước hạn',
  HoanThanhHD: 'Hoàn thành HĐ',
};

// simple_status labels
export const SIMPLE_STATUS_LABELS: Record<string, string> = {
  DangKyMoi: 'Đăng ký mới',
  DangHoc: 'Đang học',
  DaDau: 'Đã đậu',
  BaoLuu: 'Bảo lưu',
  DungChuongTrinh: 'Dừng chương trình',
  KhongHoc: 'Không học',
  Huy: 'Hủy',
  DangONhat: 'Đang ở Nhật',
  RoiCongTy: 'Rời công ty',
};

// trainee_type labels
export const TRAINEE_TYPE_LABELS: Record<string, string> = {
  TTS: 'Thực tập sinh',
  KyNang: 'Kỹ năng đặc định',
  KySu: 'Kỹ sư',
  DuHoc: 'Du học sinh',
  TTS3: 'Thực tập sinh số 3',
};

// Helper functions
export function getStageLabel(slug: string | null | undefined): string {
  if (!slug) return 'Chưa đậu';
  return PROGRESSION_STAGE_LABELS[slug] || slug;
}

export function getStatusLabel(slug: string | null | undefined): string {
  if (!slug) return 'Đăng ký mới';
  return SIMPLE_STATUS_LABELS[slug] || slug;
}

export function getTypeLabel(slug: string | null | undefined): string {
  if (!slug) return '—';
  return TRAINEE_TYPE_LABELS[slug] || slug;
}
