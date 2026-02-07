/**
 * =============================================================================
 * CẤU HÌNH XUẤT EXCEL - SINGLE SOURCE OF TRUTH
 * =============================================================================
 * 
 * ██████╗ ██╗   ██╗██╗     ███████╗███████╗
 * ██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
 * ██████╔╝██║   ██║██║     █████╗  ███████╗
 * ██╔══██╗██║   ██║██║     ██╔══╝  ╚════██║
 * ██║  ██║╚██████╔╝███████╗███████╗███████║
 * ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝
 * 
 * QUY TẮC BẤT DI BẤT DỊCH - KHÓA VÀ CHỐT
 * =============================================================================
 * 
 * 1. MỘT LUỒNG DỮ LIỆU DUY NHẤT:
 *    - File này là NGUỒN DUY NHẤT định nghĩa cấu trúc cột xuất Excel
 *    - Tất cả menu đều dùng ExportButtonWithColumns component
 *    - KHÔNG TẠO component export riêng cho từng menu
 * 
 * 2. COMPUTED COLUMNS (Cột tính toán):
 *    - Định nghĩa declarative bằng computeFrom + computeType
 *    - Logic transform nằm tập trung tại ExportButtonWithColumns
 *    - Ví dụ: STT, bỏ dấu tiếng Việt, format ngày tiếng Nhật
 * 
 * 3. KHI THÊM CỘT MỚI:
 *    - Thêm vào mảng columns tương ứng trong file này
 *    - Nếu cần transform đặc biệt → định nghĩa computeType mới
 *    - KHÔNG sửa logic export ở các page riêng lẻ
 * 
 * 4. THỨ TỰ CỘT:
 *    - Thứ tự trong mảng columns = thứ tự xuất file Excel
 *    - Phải đồng bộ với thứ tự hiển thị trên giao diện
 * 
 * CẢNH BÁO: Vi phạm các quy tắc trên sẽ phá vỡ tính nhất quán hệ thống!
 * =============================================================================
 */

export type ExportColumnFormat = 'date' | 'number' | 'currency';

/**
 * Các loại computed column được hỗ trợ:
 * - 'row_index': STT (số thứ tự)
 * - 'no_diacritics': Bỏ dấu tiếng Việt, viết hoa
 * - 'japanese_date': Format ngày sang tiếng Nhật (YYYY年MM月DD日)
 * - 'japanese_month': Format tháng sang tiếng Nhật (YYYY年MM月)
 * 
 * Để thêm loại mới: Cập nhật enum này + logic trong ExportButtonWithColumns
 */
export type ComputeType = 'row_index' | 'no_diacritics' | 'japanese_date' | 'japanese_month';

export interface ExportColumn {
  key: string;        // Tên cột DB hoặc key unique cho computed (bắt đầu '_')
  label: string;      // Tên hiển thị tiếng Việt
  format?: ExportColumnFormat;    // Format dữ liệu (date/number/currency)
  computeFrom?: string;           // Cột nguồn cho computed column
  computeType?: ComputeType;      // Loại tính toán
}

export interface ExportConfig {
  menuKey: string;    // Key menu để kiểm tra quyền
  fileName: string;   // Tên file xuất (không có extension)
  columns: ExportColumn[];  // Danh sách cột xuất
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
  { key: 'trainee_type', label: 'Đối tượng' },
  { key: 'gender', label: 'Giới tính' },
  { key: 'birth_date', label: 'Ngày sinh', format: 'date' },
  { key: 'departure_date', label: 'Ngày xuất cảnh', format: 'date' },
  { key: 'receiving_company.name', label: 'Công ty tiếp nhận' },
  { key: 'union.name', label: 'Nghiệp đoàn' },
  { key: 'job_category.name', label: 'Ngành nghề' },
  { key: 'progression_stage', label: 'Tình trạng' },
  { key: 'contract_term', label: 'Thời hạn HĐ', format: 'number' },
  { key: 'contract_end_date', label: 'Ngày hết HĐ', format: 'date' },
  { key: 'expected_return_date', label: 'Ngày dự kiến về', format: 'date' },
  { key: 'return_date', label: 'Ngày về thực tế', format: 'date' },
  { key: 'early_return_date', label: 'Ngày về sớm', format: 'date' },
  { key: 'early_return_reason', label: 'Lý do về sớm' },
  { key: 'absconded_date', label: 'Ngày bỏ trốn', format: 'date' },
  { key: 'notes', label: 'Ghi chú' },
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

/**
 * Legal - Tình trạng hồ sơ
 * 39 cột theo đúng thứ tự DOCUMENT_COLUMNS trong LegalPage
 * Bao gồm cả computed columns với computeFrom + computeType
 */
const legalColumns: ExportColumn[] = [
  // 1. STT - computed từ row index
  { key: '_stt', label: 'STT', computeType: 'row_index' },
  // 2. Mã HV
  { key: 'trainee_code', label: 'Mã HV' },
  // 3. Họ và tên
  { key: 'full_name', label: 'Họ và tên' },
  // 4. Họ và tên không dấu - computed
  { key: '_full_name_nodiac', label: 'Họ và tên không dấu', computeFrom: 'full_name', computeType: 'no_diacritics' },
  // 5. Tên phiên âm
  { key: 'furigana', label: 'Tên phiên âm' },
  // 6. Giới tính
  { key: 'gender', label: 'Giới tính' },
  // 7. Ngày tháng năm sinh
  { key: 'birth_date', label: 'Ngày tháng năm sinh', format: 'date' },
  // 8. Ngày sinh tiếng Nhật - computed
  { key: '_birth_date_jp', label: 'Ngày sinh tiếng Nhật', computeFrom: 'birth_date', computeType: 'japanese_date' },
  // 9. Nơi sinh
  { key: 'birthplace', label: 'Nơi sinh' },
  // 10. Nơi sinh không dấu - computed
  { key: '_birthplace_nodiac', label: 'Nơi sinh không dấu', computeFrom: 'birthplace', computeType: 'no_diacritics' },
  // 11. Số hộ chiếu
  { key: 'passport_number', label: 'Số hộ chiếu' },
  // 12. Ngày cấp HC
  { key: 'passport_date', label: 'Ngày cấp HC', format: 'date' },
  // 13. Ngày cấp HC (JP) - computed
  { key: '_passport_date_jp', label: 'Ngày cấp HC (JP)', computeFrom: 'passport_date', computeType: 'japanese_date' },
  // 14. Ngày dự kiến XC
  { key: 'expected_entry_month', label: 'Ngày dự kiến XC' },
  // 15. Ngày dự kiến XC (JP) - computed (month format)
  { key: '_expected_entry_month_jp', label: 'Ngày dự kiến XC (JP)', computeFrom: 'expected_entry_month', computeType: 'japanese_month' },
  // 16. Địa chỉ Việt
  { key: 'legal_address_vn', label: 'Địa chỉ Việt' },
  // 17. Địa chỉ Nhật
  { key: 'legal_address_jp', label: 'Địa chỉ Nhật' },
  // 18. Tên người bảo lãnh VN
  { key: 'guarantor_name_vn', label: 'Tên người bảo lãnh VN' },
  // 19. Tên người bảo lãnh JP
  { key: 'guarantor_name_jp', label: 'Tên người bảo lãnh JP' },
  // 20. SĐT người bảo lãnh
  { key: 'guarantor_phone', label: 'SĐT người bảo lãnh' },
  // 21. Tên trường cấp 3
  { key: 'high_school_name', label: 'Tên trường cấp 3' },
  // 22. Thời gian học
  { key: 'high_school_period', label: 'Thời gian học' },
  // 23. Trường chứng chỉ JP
  { key: 'jp_certificate_school', label: 'Trường chứng chỉ JP' },
  // 24. Thời gian học CC
  { key: 'jp_certificate_period', label: 'Thời gian học CC' },
  // 25. Tên trường JP 1
  { key: 'jp_school_1', label: 'Tên trường JP 1' },
  // 26. Khóa học JP 1
  { key: 'jp_course_1', label: 'Khóa học JP 1' },
  // 27. Tên trường JP 2
  { key: 'jp_school_2', label: 'Tên trường JP 2' },
  // 28. Khóa học JP 2
  { key: 'jp_course_2', label: 'Khóa học JP 2' },
  // 29-39: Các cột pháp lý (có thể chưa có trong DB, để sẵn)
  { key: 'dkhd_submission_date', label: 'Ngày trình ĐKHĐ', format: 'date' },
  { key: 'dkhd_number', label: 'Số ĐKHĐ' },
  { key: 'dkhd_file_code', label: 'Mã HS ĐKHĐ' },
  { key: 'tpc_request_date', label: 'Ngày gửi xin TPC', format: 'date' },
  { key: 'tpc_cv_number', label: 'Số CV xin TPC' },
  { key: 'tpc_file_code', label: 'Mã HS xin TPC' },
  { key: 'ptl_number', label: 'Số PTL' },
  { key: 'document_status', label: 'Tình trạng' },
  { key: 'ptl_issue_date', label: 'Ngày cấp PTL', format: 'date' },
  { key: 'tpc_issue_date', label: 'Ngày cấp TPC', format: 'date' },
  { key: 'current_status', label: 'Hiện trạng' },
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
