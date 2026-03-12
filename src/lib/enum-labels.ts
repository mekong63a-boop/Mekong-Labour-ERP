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

// Mapping: progression_stage → simple_status (auto-derived)
// Source of Truth: progression_stage is SSOT, simple_status is computed
const STAGE_TO_STATUS_MAP: Record<string, string> = {
  ChuaDau: 'DangKyMoi',
  DaoTao: 'DangHoc',
  DauPV: 'DaDau',
  NopHS: 'DaDau',
  OTIT: 'DaDau',
  Nyukan: 'DaDau',
  COE: 'DaDau',
  Visa: 'DaDau',
  DaXuatCanh: 'DangONhat',
  DangLamViec: 'DangONhat',
  BoTron: 'DungChuongTrinh',
  VeNuocSom: 'RoiCongTy',
  HoanThanhHD: 'RoiCongTy',
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

/**
 * Derive simple_status from progression_stage (Frontend getter).
 * This mirrors the DB trigger `auto_sync_simple_status`.
 * Returns the simple_status slug, or null if the stage allows manual override.
 */
export function getSimpleStatusFromStage(stage: string | null | undefined): string | null {
  if (!stage) return 'DangKyMoi';
  return STAGE_TO_STATUS_MAP[stage] || null;
}

/**
 * Get the display label of simple_status derived from progression_stage.
 */
export function getDerivedStatusLabel(stage: string | null | undefined): string {
  const statusSlug = getSimpleStatusFromStage(stage);
  return statusSlug ? getStatusLabel(statusSlug) : 'Đăng ký mới';
}
