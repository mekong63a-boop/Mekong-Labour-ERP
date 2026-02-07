/**
 * Cấu hình xuất Excel theo menu
 * Mỗi menu định nghĩa cột xuất với tên tiếng Việt
 */

export type ExportColumnFormat = 'date' | 'number' | 'currency';

export interface ExportColumn {
  key: string;
  label: string;
  format?: ExportColumnFormat;
}

export interface ExportConfig {
  menuKey: string;
  fileName: string;
  columns: ExportColumn[];
}

export interface PartnerExportConfig {
  menuKey: string;
  fileName: string;
  tabs: {
    companies: { fileName: string; columns: ExportColumn[] };
    unions: { fileName: string; columns: ExportColumn[] };
    job_categories: { fileName: string; columns: ExportColumn[] };
  };
}

// Separate column definitions for mutability
const traineeColumns: ExportColumn[] = [
  { key: 'trainee_code', label: 'Mã HV' },
  { key: 'full_name', label: 'Họ và tên' },
  { key: 'birth_date', label: 'Ngày sinh', format: 'date' },
  { key: 'gender', label: 'Giới tính' },
  { key: 'birthplace', label: 'Quê quán' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'cccd_number', label: 'Số CCCD' },
  { key: 'passport_number', label: 'Số hộ chiếu' },
  { key: 'progression_stage', label: 'Giai đoạn' },
  { key: 'simple_status', label: 'Trạng thái' },
  { key: 'trainee_type', label: 'Đối tượng' },
  { key: 'receiving_company.name', label: 'Công ty tiếp nhận' },
  { key: 'union.name', label: 'Nghiệp đoàn' },
  { key: 'job_category.name', label: 'Ngành nghề' },
  { key: 'departure_date', label: 'Ngày xuất cảnh', format: 'date' },
  { key: 'entry_date', label: 'Ngày nhập học', format: 'date' },
  { key: 'interview_pass_date', label: 'Ngày đậu PV', format: 'date' },
  { key: 'registration_date', label: 'Ngày đăng ký', format: 'date' },
];

const orderColumns: ExportColumn[] = [
  { key: 'code', label: 'Mã đơn hàng' },
  { key: 'company.name', label: 'Công ty' },
  { key: 'union.name', label: 'Nghiệp đoàn' },
  { key: 'job_category.name', label: 'Ngành nghề' },
  { key: 'work_address', label: 'Địa chỉ làm việc' },
  { key: 'quantity', label: 'Số lượng tuyển', format: 'number' },
  { key: 'gender_requirement', label: 'Yêu cầu giới tính' },
  { key: 'contract_term', label: 'Thời hạn HĐ', format: 'number' },
  { key: 'expected_interview_date', label: 'Ngày PV dự kiến', format: 'date' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'notes', label: 'Ghi chú' },
];

const companyColumns: ExportColumn[] = [
  { key: 'code', label: 'Mã công ty' },
  { key: 'name', label: 'Tên công ty' },
  { key: 'name_japanese', label: 'Tên tiếng Nhật' },
  { key: 'industry', label: 'Ngành nghề' },
  { key: 'work_address', label: 'Địa chỉ làm việc' },
  { key: 'address', label: 'Địa chỉ công ty' },
  { key: 'representative', label: 'Người phụ trách' },
  { key: 'phone', label: 'Điện thoại' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'notes', label: 'Ghi chú' },
];

const unionColumns: ExportColumn[] = [
  { key: 'code', label: 'Mã nghiệp đoàn' },
  { key: 'name', label: 'Tên nghiệp đoàn' },
  { key: 'name_japanese', label: 'Tên tiếng Nhật' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'contact_person', label: 'Người liên hệ' },
  { key: 'phone', label: 'Điện thoại' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'notes', label: 'Ghi chú' },
];

const jobCategoryColumns: ExportColumn[] = [
  { key: 'code', label: 'Mã ngành' },
  { key: 'name', label: 'Tên ngành nghề' },
  { key: 'name_japanese', label: 'Tên tiếng Nhật' },
  { key: 'category', label: 'Danh mục' },
  { key: 'description', label: 'Mô tả' },
  { key: 'status', label: 'Trạng thái' },
];

const educationColumns: ExportColumn[] = [
  { key: 'code', label: 'Mã lớp' },
  { key: 'name', label: 'Tên lớp' },
  { key: 'level', label: 'Trình độ' },
  { key: 'schedule', label: 'Lịch học' },
  { key: 'start_date', label: 'Ngày bắt đầu', format: 'date' },
  { key: 'expected_end_date', label: 'Ngày kết thúc dự kiến', format: 'date' },
  { key: 'max_students', label: 'Sĩ số tối đa', format: 'number' },
  { key: 'status', label: 'Trạng thái' },
];

const dormitoryColumns: ExportColumn[] = [
  { key: 'name', label: 'Tên KTX' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'capacity', label: 'Sức chứa', format: 'number' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'notes', label: 'Ghi chú' },
];

// Post Departure - Sau xuất cảnh
const postDepartureColumns: ExportColumn[] = [
  { key: 'trainee_code', label: 'Mã HV' },
  { key: 'full_name', label: 'Họ và tên' },
  { key: 'departure_date', label: 'Ngày xuất cảnh', format: 'date' },
  { key: 'receiving_company.name', label: 'Công ty tiếp nhận' },
  { key: 'union.name', label: 'Nghiệp đoàn' },
  { key: 'job_category.name', label: 'Ngành nghề' },
  { key: 'current_situation', label: 'Tình trạng hiện tại' },
  { key: 'contract_end_date', label: 'Ngày hết HĐ', format: 'date' },
  { key: 'expected_return_date', label: 'Ngày dự kiến về', format: 'date' },
  { key: 'return_date', label: 'Ngày về thực tế', format: 'date' },
  { key: 'early_return_date', label: 'Ngày về sớm', format: 'date' },
  { key: 'early_return_reason', label: 'Lý do về sớm' },
  { key: 'absconded_date', label: 'Ngày bỏ trốn', format: 'date' },
];

// Internal Union - Công đoàn nội bộ (Thành viên)
const internalUnionMemberColumns: ExportColumn[] = [
  { key: 'member_code', label: 'Mã thành viên' },
  { key: 'full_name', label: 'Họ và tên' },
  { key: 'birth_date', label: 'Ngày sinh', format: 'date' },
  { key: 'hometown', label: 'Quê quán' },
  { key: 'join_date', label: 'Ngày tham gia', format: 'date' },
  { key: 'end_date', label: 'Ngày kết thúc', format: 'date' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'notes', label: 'Ghi chú' },
];

// Internal Union - Giao dịch công đoàn
const internalUnionTransactionColumns: ExportColumn[] = [
  { key: 'transaction_type', label: 'Loại giao dịch' },
  { key: 'amount', label: 'Số tiền', format: 'currency' },
  { key: 'transaction_date', label: 'Ngày giao dịch', format: 'date' },
  { key: 'member.full_name', label: 'Thành viên' },
  { key: 'description', label: 'Mô tả' },
];

// Legal - Tình trạng hồ sơ
const legalColumns: ExportColumn[] = [
  { key: 'trainee_code', label: 'Mã HV' },
  { key: 'full_name', label: 'Họ và tên' },
  { key: 'cccd_number', label: 'Số CCCD' },
  { key: 'passport_number', label: 'Số hộ chiếu' },
  { key: 'document_status', label: 'Tình trạng hồ sơ' },
  { key: 'document_submission_date', label: 'Ngày nộp hồ sơ', format: 'date' },
  { key: 'coe_date', label: 'Ngày COE', format: 'date' },
  { key: 'visa_date', label: 'Ngày Visa', format: 'date' },
  { key: 'nyukan_entry_date', label: 'Ngày nhập cảnh', format: 'date' },
];

// Handbook - Cẩm nang tư vấn
const handbookColumns: ExportColumn[] = [
  { key: 'title', label: 'Tiêu đề' },
  { key: 'category', label: 'Danh mục' },
  { key: 'content', label: 'Nội dung' },
  { key: 'support_policy', label: 'Chính sách hỗ trợ' },
  { key: 'cost_info', label: 'Thông tin chi phí' },
  { key: 'is_published', label: 'Đã xuất bản' },
  { key: 'created_at', label: 'Ngày tạo', format: 'date' },
];

// Violations / Blacklist
const violationsColumns: ExportColumn[] = [
  { key: 'trainee.trainee_code', label: 'Mã HV' },
  { key: 'trainee.full_name', label: 'Họ và tên' },
  { key: 'content', label: 'Nội dung vi phạm' },
  { key: 'blacklist_reason', label: 'Lý do blacklist' },
  { key: 'is_blacklisted', label: 'Blacklist' },
  { key: 'created_at', label: 'Ngày tạo', format: 'date' },
];

// Teachers - Giáo viên
const teacherColumns: ExportColumn[] = [
  { key: 'code', label: 'Mã GV' },
  { key: 'full_name', label: 'Họ và tên' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Điện thoại' },
  { key: 'specialty', label: 'Chuyên môn' },
  { key: 'class_start_date', label: 'Ngày nhận lớp', format: 'date' },
  { key: 'class_end_date', label: 'Ngày kết thúc', format: 'date' },
  { key: 'status', label: 'Trạng thái' },
];

// Class Students - Học viên trong lớp
const classStudentsColumns: ExportColumn[] = [
  { key: 'trainee_code', label: 'Mã HV' },
  { key: 'full_name', label: 'Họ và tên' },
  { key: 'birth_date', label: 'Ngày sinh', format: 'date' },
  { key: 'birthplace', label: 'Quê quán' },
  { key: 'simple_status', label: 'Trạng thái' },
  { key: 'progression_stage', label: 'Giai đoạn' },
];

// Dormitory Residents - Học viên KTX
const dormitoryResidentsColumns: ExportColumn[] = [
  { key: 'trainee.trainee_code', label: 'Mã HV' },
  { key: 'trainee.full_name', label: 'Họ và tên' },
  { key: 'trainee.phone', label: 'SĐT' },
  { key: 'room_number', label: 'Phòng' },
  { key: 'bed_number', label: 'Giường' },
  { key: 'check_in_date', label: 'Ngày vào', format: 'date' },
  { key: 'check_out_date', label: 'Ngày ra', format: 'date' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'notes', label: 'Ghi chú' },
];

export const EXPORT_CONFIGS = {
  trainees: {
    menuKey: 'trainees',
    fileName: 'danh-sach-hoc-vien',
    columns: traineeColumns,
  },
  orders: {
    menuKey: 'orders',
    fileName: 'danh-sach-don-hang',
    columns: orderColumns,
  },
  partners: {
    menuKey: 'partners',
    fileName: 'danh-sach-doi-tac',
    tabs: {
      companies: {
        fileName: 'danh-sach-cong-ty',
        columns: companyColumns,
      },
      unions: {
        fileName: 'danh-sach-nghiep-doan',
        columns: unionColumns,
      },
      job_categories: {
        fileName: 'danh-sach-nganh-nghe',
        columns: jobCategoryColumns,
      },
    },
  },
  education: {
    menuKey: 'education',
    fileName: 'danh-sach-lop-hoc',
    columns: educationColumns,
  },
  dormitory: {
    menuKey: 'dormitory',
    fileName: 'danh-sach-ky-tuc-xa',
    columns: dormitoryColumns,
  },
  post_departure: {
    menuKey: 'post-departure',
    fileName: 'danh-sach-sau-xuat-canh',
    columns: postDepartureColumns,
  },
  internal_union: {
    menuKey: 'internal-union',
    fileName: 'danh-sach-thanh-vien-cong-doan',
    columns: internalUnionMemberColumns,
  },
  internal_union_transactions: {
    menuKey: 'internal-union',
    fileName: 'danh-sach-giao-dich-cong-doan',
    columns: internalUnionTransactionColumns,
  },
  legal: {
    menuKey: 'legal',
    fileName: 'tinh-trang-ho-so',
    columns: legalColumns,
  },
  handbook: {
    menuKey: 'handbook',
    fileName: 'cam-nang-tu-van',
    columns: handbookColumns,
  },
  violations: {
    menuKey: 'violations',
    fileName: 'danh-sach-vi-pham',
    columns: violationsColumns,
  },
  teachers: {
    menuKey: 'education',
    fileName: 'danh-sach-giao-vien',
    columns: teacherColumns,
  },
  class_students: {
    menuKey: 'education',
    fileName: 'danh-sach-hoc-vien-lop',
    columns: classStudentsColumns,
  },
  dormitory_residents: {
    menuKey: 'dormitory',
    fileName: 'danh-sach-hoc-vien-ktx',
    columns: dormitoryResidentsColumns,
  },
};

export type ExportConfigKey = keyof typeof EXPORT_CONFIGS;
