// Report column definitions
export interface ReportColumn {
  key: string;
  label: string;
  group: string;
  isPII?: boolean;
}

export interface ReportColumnGroup {
  name: string;
  columns: ReportColumn[];
}

// Report category presets
export interface ReportPreset {
  key: string;
  label: string;
  description: string;
  defaultColumns: string[];
  defaultFilters: Record<string, string>;
}

// Filter values
export interface ReportFilters {
  year?: string;
  month?: string;
  date_from?: string;
  date_to?: string;
  current_stage?: string;
  simple_status?: string;
  company_id?: string;
  union_id?: string;
  job_category_id?: string;
  trainee_type?: string;
  gender?: string;
  departure_from?: string;
  departure_to?: string;
  interview_pass_from?: string;
  interview_pass_to?: string;
}

// Column groups definition
export const COLUMN_GROUPS: ReportColumnGroup[] = [
  {
    name: "Thông tin học viên",
    columns: [
      { key: "trainee_code", label: "Mã học viên", group: "trainee" },
      { key: "full_name", label: "Họ và tên", group: "trainee" },
      { key: "furigana", label: "Phiên âm (Furigana)", group: "trainee" },
      { key: "birth_date", label: "Ngày sinh", group: "trainee" },
      { key: "gender", label: "Giới tính", group: "trainee" },
      { key: "birthplace", label: "Quê quán", group: "trainee" },
      { key: "ethnicity", label: "Dân tộc", group: "trainee" },
      { key: "marital_status", label: "Tình trạng hôn nhân", group: "trainee" },
      { key: "education_level", label: "Trình độ học vấn", group: "trainee" },
      { key: "trainee_type", label: "Loại chương trình", group: "trainee" },
    ],
  },
  {
    name: "Trạng thái – Tiến trình",
    columns: [
      { key: "current_stage", label: "Giai đoạn hiện tại", group: "status" },
      { key: "sub_status", label: "Trạng thái phụ", group: "status" },
      { key: "simple_status", label: "Trạng thái đơn giản", group: "status" },
      { key: "progression_stage", label: "Tiến trình cũ", group: "status" },
      { key: "enrollment_status", label: "Tình trạng nhập học", group: "status" },
      { key: "current_situation", label: "Tình hình hiện tại", group: "status" },
    ],
  },
  {
    name: "Ngày tháng quan trọng",
    columns: [
      { key: "entry_date", label: "Ngày nhập học", group: "dates" },
      { key: "registration_date", label: "Ngày đăng ký", group: "dates" },
      { key: "interview_pass_date", label: "Ngày đậu phỏng vấn", group: "dates" },
      { key: "document_submission_date", label: "Ngày nộp hồ sơ", group: "dates" },
      { key: "otit_entry_date", label: "Ngày OTIT", group: "dates" },
      { key: "nyukan_entry_date", label: "Ngày Nyukan", group: "dates" },
      { key: "coe_date", label: "Ngày COE", group: "dates" },
      { key: "departure_date", label: "Ngày xuất cảnh", group: "dates" },
      { key: "return_date", label: "Ngày về nước", group: "dates" },
      { key: "expected_return_date", label: "Ngày dự kiến về", group: "dates" },
      { key: "contract_end_date", label: "Ngày hết hợp đồng", group: "dates" },
    ],
  },
  {
    name: "Đơn hàng – Công ty – Nghiệp đoàn",
    columns: [
      { key: "company_name", label: "Công ty tiếp nhận", group: "order" },
      { key: "company_code", label: "Mã công ty", group: "order" },
      { key: "union_name", label: "Nghiệp đoàn", group: "order" },
      { key: "union_code", label: "Mã nghiệp đoàn", group: "order" },
      { key: "job_category_name", label: "Ngành nghề", group: "order" },
      { key: "job_category_code", label: "Mã ngành nghề", group: "order" },
      { key: "contract_term", label: "Thời hạn hợp đồng (năm)", group: "order" },
      { key: "interview_count", label: "Số lần phỏng vấn", group: "order" },
    ],
  },
  {
    name: "Lớp học",
    columns: [
      { key: "class_name", label: "Tên lớp", group: "class" },
    ],
  },
  {
    name: "Sức khỏe",
    columns: [
      { key: "height", label: "Chiều cao (cm)", group: "health" },
      { key: "weight", label: "Cân nặng (kg)", group: "health" },
      { key: "blood_group", label: "Nhóm máu", group: "health" },
      { key: "vision_left", label: "Thị lực trái", group: "health" },
      { key: "vision_right", label: "Thị lực phải", group: "health" },
      { key: "health_status", label: "Tình trạng sức khỏe", group: "health" },
      { key: "dominant_hand", label: "Tay thuận", group: "health" },
      { key: "smoking", label: "Hút thuốc", group: "health" },
      { key: "drinking", label: "Uống rượu", group: "health" },
      { key: "tattoo", label: "Xăm mình", group: "health" },
    ],
  },
  {
    name: "Thông tin nhạy cảm (PII)",
    columns: [
      { key: "phone", label: "Số điện thoại", group: "pii", isPII: true },
      { key: "email", label: "Email", group: "pii", isPII: true },
      { key: "parent_phone_1", label: "SĐT phụ huynh 1", group: "pii", isPII: true },
      { key: "parent_phone_2", label: "SĐT phụ huynh 2", group: "pii", isPII: true },
      { key: "cccd_number", label: "Số CCCD", group: "pii", isPII: true },
      { key: "cccd_date", label: "Ngày cấp CCCD", group: "pii", isPII: true },
      { key: "cccd_place", label: "Nơi cấp CCCD", group: "pii", isPII: true },
      { key: "passport_number", label: "Số hộ chiếu", group: "pii", isPII: true },
      { key: "passport_date", label: "Ngày cấp hộ chiếu", group: "pii", isPII: true },
    ],
  },
  {
    name: "Địa chỉ",
    columns: [
      { key: "current_address", label: "Địa chỉ hiện tại", group: "address" },
      { key: "permanent_address", label: "Địa chỉ thường trú", group: "address" },
      { key: "household_address", label: "Địa chỉ hộ khẩu", group: "address" },
    ],
  },
  {
    name: "Khác",
    columns: [
      { key: "source", label: "Nguồn tuyển", group: "other" },
      { key: "policy_category", label: "Diện chính sách", group: "other" },
      { key: "religion", label: "Tôn giáo", group: "other" },
      { key: "hobbies", label: "Sở thích", group: "other" },
      { key: "notes", label: "Ghi chú", group: "other" },
      { key: "created_at", label: "Ngày tạo", group: "other" },
      { key: "updated_at", label: "Ngày cập nhật", group: "other" },
    ],
  },
];

// Report presets
export const REPORT_PRESETS: ReportPreset[] = [
  {
    key: "all_trainees",
    label: "Tất cả học viên",
    description: "Danh sách đầy đủ tất cả học viên trong hệ thống",
    defaultColumns: ["trainee_code", "full_name", "birth_date", "gender", "current_stage", "company_name"],
    defaultFilters: {},
  },
  {
    key: "departed",
    label: "Học viên xuất cảnh",
    description: "Danh sách học viên đã xuất cảnh sang Nhật",
    defaultColumns: ["trainee_code", "full_name", "departure_date", "company_name", "union_name", "job_category_name", "contract_term"],
    defaultFilters: { current_stage: "departed" },
  },
  {
    key: "interview_passed",
    label: "Đậu phỏng vấn",
    description: "Học viên đã đậu phỏng vấn đang chờ xử lý hồ sơ",
    defaultColumns: ["trainee_code", "full_name", "interview_pass_date", "company_name", "union_name", "current_stage"],
    defaultFilters: {},
  },
  {
    key: "training",
    label: "Đang đào tạo",
    description: "Học viên đang trong quá trình đào tạo tại trung tâm",
    defaultColumns: ["trainee_code", "full_name", "class_name", "entry_date", "enrollment_status"],
    defaultFilters: { current_stage: "trained" },
  },
  {
    key: "post_departure",
    label: "Đang ở Nhật",
    description: "Học viên đang làm việc tại Nhật Bản",
    defaultColumns: ["trainee_code", "full_name", "departure_date", "company_name", "expected_return_date", "contract_term"],
    defaultFilters: { current_stage: "post_departure" },
  },
  {
    key: "archived",
    label: "Bảo lưu / Hủy",
    description: "Học viên đã hoàn thành hợp đồng, bỏ trốn hoặc về nước sớm",
    defaultColumns: ["trainee_code", "full_name", "current_stage", "sub_status", "early_return_date", "early_return_reason"],
    defaultFilters: { current_stage: "archived" },
  },
];

// Get all column keys as flat array
export const getAllColumnKeys = (): string[] => {
  return COLUMN_GROUPS.flatMap(group => group.columns.map(col => col.key));
};

// Get column label by key
export const getColumnLabel = (key: string): string => {
  for (const group of COLUMN_GROUPS) {
    const col = group.columns.find(c => c.key === key);
    if (col) return col.label;
  }
  return key;
};

// Check if column is PII
export const isColumnPII = (key: string): boolean => {
  for (const group of COLUMN_GROUPS) {
    const col = group.columns.find(c => c.key === key);
    if (col) return col.isPII === true;
  }
  return false;
};
