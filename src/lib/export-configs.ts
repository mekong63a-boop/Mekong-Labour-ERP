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
  dormitories: {
    menuKey: 'dormitories',
    fileName: 'danh-sach-ky-tuc-xa',
    columns: dormitoryColumns,
  },
};

export type ExportConfigKey = keyof typeof EXPORT_CONFIGS;
