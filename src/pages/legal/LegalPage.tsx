import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Search, Building2, Users, FileCheck, FileClock, FileX, GraduationCap, Wrench, UserCheck, ChevronDown, ChevronLeft, BarChart3, FileText, Send } from "lucide-react";
import { removeVietnameseDiacritics, formatJapaneseDate } from "@/lib/vietnamese-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExportButtonWithColumns } from '@/components/ui/export-button-with-columns';
import { EXPORT_CONFIGS } from '@/lib/export-configs';

interface CompanyBatch {
  company_id: string;
  code: string;
  name: string;
  name_japanese: string | null;
  address: string | null;
  work_address: string | null;
  union_name: string | null;
  job_category_name: string | null;
  interview_pass_date: string;
  docs_not_started: number;
  docs_in_progress: number;
  docs_completed: number;
  total_passed: number;
}

type DocumentStatusFilter = 'in_progress' | 'completed' | null;

// Interface cho thống kê phiếu
interface FormStats {
  total_forms: number;
  approved_forms: number;
  total_workers: number;
  male_workers: number;
  female_workers: number;
}

interface TraineeTypeCount {
  trainee_type: string | null;
  count: number;
  male_count: number;
  female_count: number;
}

interface TraineeBasic {
  id: string;
  trainee_code: string;
  full_name: string;
  gender: string | null;
  birth_date: string | null;
  progression_stage: string | null;
  document_status: string | null;
  receiving_company: { name: string } | null;
}

interface CompanyTrainee {
  id: string;
  trainee_code: string;
  full_name: string;
  furigana: string | null;
  gender: string | null;
  birth_date: string | null;
  birthplace: string | null;
  passport_number: string | null;
  passport_date: string | null;
  expected_entry_month: string | null;
  legal_address_vn: string | null;
  legal_address_jp: string | null;
  guarantor_name_vn: string | null;
  guarantor_name_jp: string | null;
  guarantor_phone: string | null;
  high_school_name: string | null;
  high_school_period: string | null;
  jp_certificate_school: string | null;
  jp_certificate_period: string | null;
  jp_school_1: string | null;
  jp_course_1: string | null;
  jp_school_2: string | null;
  jp_course_2: string | null;
  progression_stage: string | null;
  document_status: string | null;
  recommending_company: { name: string; representative: string | null; position: string | null } | null;
}

const TRAINEE_TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  'Thực tập sinh': { label: 'Thực tập sinh', icon: Users },
  'Thực tập sinh số 3': { label: 'TTS số 3', icon: Users },
  'Du học sinh': { label: 'Du học sinh', icon: GraduationCap },
  'Kỹ năng đặc định': { label: 'Kỹ năng đặc định', icon: Wrench },
  'Kỹ sư': { label: 'Kỹ sư', icon: UserCheck },
};

const DOCUMENT_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Chưa làm', className: 'bg-orange-50 text-orange-700' },
  { value: 'in_progress', label: 'Đang làm', className: 'bg-blue-50 text-blue-700' },
  { value: 'completed', label: 'Đã xong', className: 'bg-green-50 text-green-700' },
];

// Columns for the document checklist table
const DOCUMENT_COLUMNS = [
  'STT', 'Mã HV', 'Họ và tên', 'Họ và tên không dấu', 'Tên phiên âm', 
  'Giới tính', 'Ngày tháng năm sinh', 'Ngày sinh tiếng Nhật',
  'Nơi sinh', 'Nơi sinh không dấu', 
  'Số hộ chiếu', 'Ngày cấp HC', 'Ngày cấp HC (JP)',
  'Ngày dự kiến XC', 'Ngày dự kiến XC (JP)',
  'Địa chỉ Việt', 'Địa chỉ Nhật',
  'Tên người bảo lãnh VN', 'Tên người bảo lãnh JP', 'SĐT người bảo lãnh',
  'Tên trường cấp 3', 'Thời gian học',
  'Trường chứng chỉ JP', 'Thời gian học CC',
  'Tên trường JP 1', 'Khóa học JP 1',
  'Tên trường JP 2', 'Khóa học JP 2',
  'Tên công ty tiến cử', 'Tên người đại diện', 'Chức vụ',
  'Ngày trình ĐKHĐ', 'Số ĐKHĐ', 'Mã HS ĐKHĐ',
  'Ngày gửi xin TPC', 'Số CV xin TPC', 'Mã HS xin TPC',
  'Số PTL', 'Tình trạng', 'Ngày cấp PTL', 'Ngày cấp TPC', 'Hiện trạng'
];

// View modes
type ViewMode = 'list' | 'type-detail' | 'company-detail';

export default function LegalPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatusFilter>(null);
  const [showStats, setShowStats] = useState(true);
  const [mainTab, setMainTab] = useState<string>("documents"); // Thêm state cho main tabs
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCompanyBatch, setSelectedCompanyBatch] = useState<CompanyBatch | null>(null);
  const [exportDocStatus, setExportDocStatus] = useState<string>('all');

  // SYSTEM RULE: Query từ database view legal_company_stats (grouped by company + date)
  const { data: companyBatches = [], isLoading } = useQuery({
    queryKey: ["legal-company-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_company_stats")
        .select("*")
        .order("interview_pass_date", { ascending: false });

      if (error) throw error;
      return (data || []) as CompanyBatch[];
    },
  });

  // SYSTEM RULE: Query từ database view legal_summary_stats
  const { data: summaryStats } = useQuery({
    queryKey: ["legal-summary-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_summary_stats")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data as {
        total_companies: number;
        total_all: number;
        docs_not_started: number;
        docs_in_progress: number;
        docs_completed: number;
      };
    },
  });

  // SYSTEM RULE: Query từ database view legal_trainee_type_stats
  const { data: typeStats = [] } = useQuery({
    queryKey: ["legal-trainee-type-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_trainee_type_stats")
        .select("*");

      if (error) throw error;
      return (data || []) as TraineeTypeCount[];
    },
  });

  // === QUERY: Thống kê Số phiếu trả lời (dựa trên dkhd_code) ===
  const { data: dkhdStats } = useQuery({
    queryKey: ["legal-dkhd-stats"],
    queryFn: async () => {
      // Đếm số phiếu (mã unique) và số lao động từ trainees có dkhd_code
      const { data, error } = await supabase
        .from("trainees")
        .select("dkhd_code, gender, ptl_date")
        .eq("progression_stage", 'Đậu phỏng vấn')
        .not("dkhd_code", "is", null);

      if (error) throw error;

      // Tính toán: phiếu = mã unique, lao động = tổng số trainees có mã
      const workers = data || [];
      const uniqueCodes = new Set(workers.map(t => t.dkhd_code));
      
      // Phiếu đã duyệt: mã có ít nhất 1 trainee đã có ptl_date
      const approvedCodes = new Set(
        workers.filter(t => t.ptl_date).map(t => t.dkhd_code)
      );
      
      const maleCount = workers.filter(t => t.gender === 'Nam').length;
      const femaleCount = workers.filter(t => t.gender === 'Nữ').length;

      return {
        total_forms: uniqueCodes.size,
        approved_forms: approvedCodes.size,
        total_workers: workers.length,
        male_workers: maleCount,
        female_workers: femaleCount,
      } as FormStats;
    },
  });

  // === QUERY: Thống kê Thư phái cử (dựa trên tpc_code) ===
  const { data: tpcStats } = useQuery({
    queryKey: ["legal-tpc-stats"],
    queryFn: async () => {
      // Đếm số phiếu (mã unique) và số lao động từ trainees có tpc_code
      const { data, error } = await supabase
        .from("trainees")
        .select("tpc_code, gender, ptl_date")
        .eq("progression_stage", 'Đậu phỏng vấn')
        .not("tpc_code", "is", null);

      if (error) throw error;

      // Tính toán: phiếu = mã unique, lao động = tổng số trainees có mã
      const workers = data || [];
      const uniqueCodes = new Set(workers.map(t => t.tpc_code));
      
      // Thư đã duyệt: mã có ít nhất 1 trainee đã có ptl_date
      const approvedCodes = new Set(
        workers.filter(t => t.ptl_date).map(t => t.tpc_code)
      );
      
      const maleCount = workers.filter(t => t.gender === 'Nam').length;
      const femaleCount = workers.filter(t => t.gender === 'Nữ').length;

      return {
        total_forms: uniqueCodes.size,
        approved_forms: approvedCodes.size,
        total_workers: workers.length,
        male_workers: maleCount,
        female_workers: femaleCount,
      } as FormStats;
    },
  });

  const { data: traineesByType = [], isLoading: isLoadingTrainees } = useQuery({
    queryKey: ["legal-trainees-by-type", selectedType],
    queryFn: async () => {
      if (!selectedType) return [];
      
      // Query học viên theo loại, chỉ cần progression_stage = 'Đậu phỏng vấn'
      // Không yêu cầu interview_pass_date vì có thể chưa nhập
      const { data, error } = await supabase
        .from("trainees")
        .select(`
          id,
          trainee_code,
          full_name,
          gender,
          birth_date,
          progression_stage,
          document_status,
          receiving_company:companies!fk_trainees_company(name)
        `)
        .eq("trainee_type", selectedType as any)
        .not("receiving_company_id", "is", null)
        .eq("progression_stage", 'Đậu phỏng vấn')
        .order("full_name");

      if (error) throw error;
      return (data || []) as TraineeBasic[];
    },
    enabled: !!selectedType && viewMode === 'type-detail',
  });

  // Query trainees for company batch - only document processing stages
  const { data: companyTrainees = [], isLoading: isLoadingCompanyTrainees } = useQuery({
    queryKey: ["legal-company-trainees", selectedCompanyBatch?.company_id],
    queryFn: async () => {
      if (!selectedCompanyBatch) return [];
      
      // Query tất cả học viên của công ty có progression_stage = 'Đậu phỏng vấn'
      // Không filter theo interview_pass_date vì có thể chưa được nhập
      const { data, error } = await supabase
        .from("trainees")
        .select(`
          id,
          trainee_code,
          full_name,
          furigana,
          gender,
          birth_date,
          birthplace,
          passport_number,
          passport_date,
          expected_entry_month,
          legal_address_vn,
          legal_address_jp,
          guarantor_name_vn,
          guarantor_name_jp,
          guarantor_phone,
          high_school_name,
          high_school_period,
          jp_certificate_school,
          jp_certificate_period,
          jp_school_1,
          jp_course_1,
          jp_school_2,
          jp_course_2,
          progression_stage,
          document_status,
          recommending_company:companies!fk_trainees_company(name, representative, position)
        `)
        .eq("receiving_company_id", selectedCompanyBatch.company_id)
        .eq("progression_stage", 'Đậu phỏng vấn')
        .order("full_name");

      if (error) throw error;
      return (data || []) as CompanyTrainee[];
    },
    enabled: !!selectedCompanyBatch && viewMode === 'company-detail',
  });

  // Mutation to update document status
  const updateDocStatusMutation = useMutation({
    mutationFn: async ({ traineeId, status }: { traineeId: string; status: string }) => {
      const { error } = await supabase
        .from("trainees")
        .update({ document_status: status })
        .eq("id", traineeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật tình trạng hồ sơ");
      queryClient.invalidateQueries({ queryKey: ["legal-company-stats"] });
      queryClient.invalidateQueries({ queryKey: ["legal-summary-stats"] });
      queryClient.invalidateQueries({ queryKey: ["legal-trainees-by-type"] });
      queryClient.invalidateQueries({ queryKey: ["legal-company-trainees"] });
    },
    onError: () => {
      toast.error("Lỗi khi cập nhật");
    },
  });

  // Mutation to update legal fields (address, guarantor, etc.)
  const updateLegalFieldMutation = useMutation({
    mutationFn: async ({ traineeId, field, value }: { traineeId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from("trainees")
        .update({ [field]: value || null })
        .eq("id", traineeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-company-trainees"] });
    },
    onError: () => {
      toast.error("Lỗi khi cập nhật");
    },
  });

  // Build type counts map with gender breakdown
  const typeCountsMap = typeStats.reduce((acc, item) => {
    if (item.trainee_type) {
      acc[item.trainee_type] = {
        count: item.count,
        male: item.male_count,
        female: item.female_count
      };
    }
    return acc;
  }, {} as Record<string, { count: number; male: number; female: number }>);

  // Filter batches by search and status
  const filteredBatches = companyBatches.filter(batch => {
    const matchesSearch = (
      batch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.name_japanese?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (batch.union_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (batch.job_category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
    
    if (!matchesSearch) return false;
    
    // Filter by status
    if (statusFilter === 'in_progress') {
      return batch.docs_in_progress > 0;
    } else if (statusFilter === 'completed') {
      return batch.docs_completed > 0 && batch.docs_in_progress === 0;
    }
    
    return true;
  });

  const handleTypeClick = (type: string) => {
    setSelectedType(type);
    setViewMode('type-detail');
  };

  const handleCompanyClick = (batch: CompanyBatch) => {
    setSelectedCompanyBatch(batch);
    setViewMode('company-detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedType(null);
    setSelectedCompanyBatch(null);
  };

  const handleDocStatusChange = (traineeId: string, status: string) => {
    updateDocStatusMutation.mutate({ traineeId, status });
  };

  const handleLegalFieldBlur = (traineeId: string, field: string, value: string) => {
    updateLegalFieldMutation.mutate({ traineeId, field, value });
  };


  // Render trainee type detail view
  const renderTypeDetailView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
          <CardTitle className="text-base">
            {selectedType ? TRAINEE_TYPE_CONFIG[selectedType]?.label : ''} - Danh sách học viên đậu PV (chưa xuất cảnh)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingTrainees ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : traineesByType.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Không có học viên</div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Mã HV</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead className="w-[80px]">Giới tính</TableHead>
                  <TableHead className="w-[100px]">Năm sinh</TableHead>
                  <TableHead>Công ty</TableHead>
                  <TableHead className="w-[120px]">Giai đoạn</TableHead>
                  <TableHead className="w-[150px]">Tình trạng HS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {traineesByType.map((trainee) => (
                  <TableRow key={trainee.id}>
                    <TableCell className="font-mono">{trainee.trainee_code}</TableCell>
                    <TableCell className="font-medium">{trainee.full_name}</TableCell>
                    <TableCell>{trainee.gender || "—"}</TableCell>
                    <TableCell>
                      {trainee.birth_date 
                        ? new Date(trainee.birth_date).getFullYear()
                        : "—"
                      }
                    </TableCell>
                    <TableCell className="text-sm">
                      {trainee.receiving_company?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {trainee.progression_stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={trainee.document_status || 'not_started'}
                        onValueChange={(value) => handleDocStatusChange(trainee.id, value)}
                      >
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className={`px-2 py-0.5 rounded text-xs ${opt.className}`}>
                                {opt.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render company detail view with 20 columns
  const renderCompanyDetailView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Quay lại
            </Button>
            <div>
              <CardTitle className="text-base">{selectedCompanyBatch?.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedCompanyBatch?.name_japanese && `${selectedCompanyBatch.name_japanese} • `}
                Công ty {selectedCompanyBatch?.code}
              </p>
            </div>
          </div>
          
          {/* Export section with document status filter */}
          <div className="flex items-center gap-2">
            <Select value={exportDocStatus} onValueChange={setExportDocStatus}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Lọc theo tình trạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hồ sơ</SelectItem>
                <SelectItem value="not_started">Chưa làm</SelectItem>
                <SelectItem value="in_progress">Đang làm</SelectItem>
                <SelectItem value="completed">Đã xong</SelectItem>
              </SelectContent>
            </Select>
            <ExportButtonWithColumns
              menuKey="legal"
              tableName="trainees"
              allColumns={EXPORT_CONFIGS.legal.columns}
              fileName={`ho-so-${selectedCompanyBatch?.code || 'cty'}-${exportDocStatus === 'all' ? 'tat-ca' : exportDocStatus}`}
              filters={{
                receiving_company_id: selectedCompanyBatch?.company_id || '',
                progression_stage: 'Đậu phỏng vấn',
                ...(exportDocStatus !== 'all' && { document_status: exportDocStatus })
              }}
              title={`Xuất hồ sơ - ${selectedCompanyBatch?.name || ''}`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingCompanyTrainees ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {DOCUMENT_COLUMNS.map((col, idx) => (
                    <TableHead 
                      key={idx} 
                      className={`text-xs whitespace-nowrap ${idx <= 4 ? 'bg-muted/50' : ''}`}
                    >
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyTrainees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={33} className="text-center py-8 text-muted-foreground">
                      Không có học viên
                    </TableCell>
                  </TableRow>
                ) : (
                  companyTrainees.map((trainee, idx) => (
                    <TableRow key={trainee.id}>
                      <TableCell className="text-center">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{trainee.trainee_code}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{trainee.full_name}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {removeVietnameseDiacritics(trainee.full_name)}
                      </TableCell>
                      <TableCell className={`whitespace-nowrap ${!trainee.furigana ? 'bg-orange-50 text-orange-600' : ''}`}>
                        {trainee.furigana || "—"}
                      </TableCell>
                      <TableCell className="text-center">{trainee.gender || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {trainee.birth_date 
                          ? format(new Date(trainee.birth_date), "dd/MM/yyyy", { locale: vi })
                          : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatJapaneseDate(trainee.birth_date)}
                      </TableCell>
                      {/* Nơi sinh có dấu */}
                      <TableCell className={`whitespace-nowrap ${!trainee.birthplace ? 'bg-orange-50 text-orange-600' : ''}`}>
                        {trainee.birthplace || "—"}
                      </TableCell>
                      {/* Nơi sinh không dấu */}
                      <TableCell className={`whitespace-nowrap ${!trainee.birthplace ? 'bg-orange-50 text-orange-600' : ''}`}>
                        {trainee.birthplace ? removeVietnameseDiacritics(trainee.birthplace) : "—"}
                      </TableCell>
                      {/* Số hộ chiếu */}
                      <TableCell className={`font-mono text-xs ${!trainee.passport_number ? 'bg-orange-50 text-orange-600' : ''}`}>
                        {trainee.passport_number || "—"}
                      </TableCell>
                      {/* Ngày cấp hộ chiếu */}
                      <TableCell className={`whitespace-nowrap ${!trainee.passport_date ? 'bg-orange-50 text-orange-600' : ''}`}>
                        {trainee.passport_date 
                          ? format(new Date(trainee.passport_date), "dd/MM/yyyy", { locale: vi })
                          : "—"}
                      </TableCell>
                      {/* Ngày cấp hộ chiếu tiếng Nhật */}
                      <TableCell className={`whitespace-nowrap ${!trainee.passport_date ? 'bg-orange-50 text-orange-600' : ''}`}>
                        {formatJapaneseDate(trainee.passport_date)}
                      </TableCell>
                      {/* Ngày dự kiến XC */}
                      <TableCell className={`whitespace-nowrap ${!trainee.expected_entry_month ? 'bg-orange-50 text-orange-600' : ''}`}>
                        {trainee.expected_entry_month || "—"}
                      </TableCell>
                      {/* Ngày dự kiến XC tiếng Nhật */}
                      <TableCell className={`whitespace-nowrap ${!trainee.expected_entry_month ? 'bg-orange-50 text-orange-600' : ''}`}>
                        {trainee.expected_entry_month 
                          ? formatJapaneseDate(trainee.expected_entry_month)
                          : "—"}
                      </TableCell>
                      {/* Địa chỉ Việt - editable */}
                      <TableCell className={`min-w-[150px] ${!trainee.legal_address_vn ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.legal_address_vn ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.legal_address_vn || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "legal_address_vn", e.target.value)}
                          placeholder="Nhập địa chỉ VN"
                        />
                      </TableCell>
                      {/* Địa chỉ Nhật - editable */}
                      <TableCell className={`min-w-[150px] ${!trainee.legal_address_jp ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.legal_address_jp ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.legal_address_jp || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "legal_address_jp", e.target.value)}
                          placeholder="日本住所"
                        />
                      </TableCell>
                      {/* Tên người bảo lãnh VN - editable */}
                      <TableCell className={`min-w-[120px] ${!trainee.guarantor_name_vn ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.guarantor_name_vn ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.guarantor_name_vn || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "guarantor_name_vn", e.target.value)}
                          placeholder="Tên BL VN"
                        />
                      </TableCell>
                      {/* Tên người bảo lãnh JP - editable */}
                      <TableCell className={`min-w-[120px] ${!trainee.guarantor_name_jp ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.guarantor_name_jp ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.guarantor_name_jp || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "guarantor_name_jp", e.target.value)}
                          placeholder="保証人名"
                        />
                      </TableCell>
                      {/* SĐT người bảo lãnh - editable */}
                      <TableCell className={`min-w-[100px] ${!trainee.guarantor_phone ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs font-mono ${!trainee.guarantor_phone ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.guarantor_phone || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "guarantor_phone", e.target.value)}
                          placeholder="SĐT"
                        />
                      </TableCell>
                      {/* Tên trường cấp 3 - manual input */}
                      <TableCell className={`min-w-[180px] ${!trainee.high_school_name ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.high_school_name ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.high_school_name || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "high_school_name", e.target.value)}
                          placeholder="VD: CHU VAN AN高等学校"
                        />
                      </TableCell>
                      {/* Thời gian học cấp 3 - manual input */}
                      <TableCell className={`min-w-[150px] ${!trainee.high_school_period ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.high_school_period ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.high_school_period || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "high_school_period", e.target.value)}
                          placeholder="2002年09月~2005年06月"
                        />
                      </TableCell>
                      {/* Trường chứng chỉ JP - manual input */}
                      <TableCell className={`min-w-[220px] ${!trainee.jp_certificate_school ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.jp_certificate_school ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.jp_certificate_school || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "jp_certificate_school", e.target.value)}
                          placeholder="VD: QUANG TRUNG専門学校"
                        />
                      </TableCell>
                      {/* Thời gian học chứng chỉ JP - manual input */}
                      <TableCell className={`min-w-[150px] ${!trainee.jp_certificate_period ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.jp_certificate_period ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.jp_certificate_period || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "jp_certificate_period", e.target.value)}
                          placeholder="2002年09月~2005年06月"
                        />
                      </TableCell>
                      {/* Tên trường JP 1 - manual input */}
                      <TableCell className={`min-w-[180px] ${!trainee.jp_school_1 ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.jp_school_1 ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.jp_school_1 || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "jp_school_1", e.target.value)}
                          placeholder="Tên trường JP 1"
                        />
                      </TableCell>
                      {/* Khóa học JP 1 - manual input */}
                      <TableCell className={`min-w-[150px] ${!trainee.jp_course_1 ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.jp_course_1 ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.jp_course_1 || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "jp_course_1", e.target.value)}
                          placeholder="2002年09月~2005年06月"
                        />
                      </TableCell>
                      {/* Tên trường JP 2 - manual input */}
                      <TableCell className={`min-w-[180px] ${!trainee.jp_school_2 ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.jp_school_2 ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.jp_school_2 || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "jp_school_2", e.target.value)}
                          placeholder="Tên trường JP 2"
                        />
                      </TableCell>
                      {/* Khóa học JP 2 - manual input */}
                      <TableCell className={`min-w-[150px] ${!trainee.jp_course_2 ? 'bg-orange-50' : ''}`}>
                        <Input
                          className={`h-7 text-xs ${!trainee.jp_course_2 ? 'border-orange-300 placeholder:text-orange-400' : ''}`}
                          defaultValue={trainee.jp_course_2 || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "jp_course_2", e.target.value)}
                          placeholder="2002年09月~2005年06月"
                        />
                      </TableCell>
                      {/* Tên công ty tiến cử */}
                      <TableCell className="whitespace-nowrap">
                        {trainee.recommending_company?.name || "—"}
                      </TableCell>
                      {/* Tên người đại diện */}
                      <TableCell className="whitespace-nowrap">
                        {trainee.recommending_company?.representative || "—"}
                      </TableCell>
                      {/* Chức vụ */}
                      <TableCell className="whitespace-nowrap">
                        {trainee.recommending_company?.position || "—"}
                      </TableCell>
                      {/* Empty cells for remaining columns - to be filled manually */}
                      {Array.from({ length: 11 }).map((_, cellIdx) => (
                        <TableCell key={cellIdx} className="text-center">
                          —
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render main list view
  const renderListView = () => (
    <>
      {/* Summary Stats Cards - with toggle */}
      {showStats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tổng công ty</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats?.total_companies || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tổng HV đậu</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats?.total_all || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">HS chưa làm</CardTitle>
                <FileX className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{summaryStats?.docs_not_started || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">HS đang làm</CardTitle>
                <FileClock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{summaryStats?.docs_in_progress || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">HS đã làm</CardTitle>
                <FileCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summaryStats?.docs_completed || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Trainee Type Tabs with Gender Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(TRAINEE_TYPE_CONFIG).map(([type, config]) => {
              const stats = typeCountsMap[type] || { count: 0, male: 0, female: 0 };
              const Icon = config.icon;
              
              return (
                <Card 
                  key={type}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary"
                  onClick={() => handleTypeClick(type)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{config.label}</span>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-primary">{stats.count}</div>
                    {stats.count > 0 && (
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-blue-600">{stats.male} Nam</span>
                        <span className="text-red-500">{stats.female} Nữ</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Company Batches Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">Danh sách công ty đang làm hồ sơ</CardTitle>
            <div className="flex items-center gap-3">
              {/* Status Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {statusFilter === 'in_progress' ? (
                      <><FileClock className="h-4 w-4 text-blue-500" /> HS đang làm</>
                    ) : statusFilter === 'completed' ? (
                      <><FileCheck className="h-4 w-4 text-green-500" /> HS đã làm</>
                    ) : (
                      <>Tình trạng</>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                    Tất cả
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>
                    <FileClock className="h-4 w-4 mr-2 text-blue-500" />
                    Hồ sơ đang làm ({summaryStats?.docs_in_progress || 0})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                    <FileCheck className="h-4 w-4 mr-2 text-green-500" />
                    Hồ sơ đã làm ({summaryStats?.docs_completed || 0})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm công ty, nghiệp đoàn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải...
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter
                ? "Không tìm thấy công ty phù hợp" 
                : "Chưa có công ty nào đang làm hồ sơ"
              }
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên công ty</TableHead>
                    <TableHead>Nghiệp đoàn</TableHead>
                    <TableHead>Ngành nghề</TableHead>
                    <TableHead className="w-[120px]">Ngày phỏng vấn</TableHead>
                    <TableHead className="text-center w-[80px]">Số HV</TableHead>
                    <TableHead className="w-[140px]">Tình trạng</TableHead>
                    <TableHead className="text-center w-[100px]">HĐ 1-14; 1-15</TableHead>
                    <TableHead className="text-center w-[100px]">Thư phái cử</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch, idx) => {
                    // Determine status for this batch
                    const batchStatus = batch.docs_in_progress > 0 
                      ? 'in_progress' 
                      : batch.docs_completed > 0 
                        ? 'completed' 
                        : 'not_started';
                    
                    return (
                      <TableRow key={`${batch.company_id}-${batch.interview_pass_date}-${idx}`}>
                        <TableCell>
                          <button
                            onClick={() => handleCompanyClick(batch)}
                            className="text-left hover:text-primary transition-colors"
                          >
                            <p className="font-medium hover:underline">{batch.name}</p>
                            {batch.name_japanese && (
                              <p className="text-xs text-muted-foreground">{batch.name_japanese}</p>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm">
                          {batch.union_name || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {batch.job_category_name || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(batch.interview_pass_date), "dd/MM/yyyy", { locale: vi })}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {batch.total_passed}
                        </TableCell>
                        <TableCell>
                          {batchStatus === 'in_progress' ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 gap-1">
                              <FileClock className="h-3 w-3" />
                              Đang làm ({batch.docs_in_progress})
                            </Badge>
                          ) : batchStatus === 'completed' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 gap-1">
                              <FileCheck className="h-3 w-3" />
                              Đã xong ({batch.docs_completed})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 gap-1">
                              <FileX className="h-3 w-3" />
                              Chưa làm ({batch.docs_not_started})
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">—</TableCell>
                        <TableCell className="text-center text-muted-foreground">—</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  // Render stats tab for Số phiếu trả lời
  const renderDkhdStatsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Số lượng đăng ký PTL */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Số lượng đăng ký PTL</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{dkhdStats?.total_forms || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Mỗi mã HS ĐKHĐ = 1 phiếu
            </p>
          </CardContent>
        </Card>

        {/* Số lượng PTL đã được duyệt */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PTL đã được duyệt</CardTitle>
            <FileCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dkhdStats?.approved_forms || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Có ngày cấp PTL
            </p>
          </CardContent>
        </Card>

        {/* Tổng số lao động đã đăng ký */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Số lao động đã ĐK</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dkhdStats?.total_workers || 0}</div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-blue-600">{dkhdStats?.male_workers || 0} Nam</span>
              <span className="text-pink-600">{dkhdStats?.female_workers || 0} Nữ</span>
            </div>
          </CardContent>
        </Card>

        {/* Tỷ lệ giới tính */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ giới tính</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(dkhdStats?.total_workers || 0) > 0 ? (
                <>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Nam {Math.round(((dkhdStats?.male_workers || 0) / (dkhdStats?.total_workers || 1)) * 100)}%
                  </Badge>
                  <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                    Nữ {Math.round(((dkhdStats?.female_workers || 0) / (dkhdStats?.total_workers || 1)) * 100)}%
                  </Badge>
                </>
              ) : (
                <span className="text-muted-foreground text-sm">Chưa có dữ liệu</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Để thống kê, vui lòng nhập <strong>Mã HS ĐKHĐ</strong> trong chi tiết từng đợt công ty</p>
            <p className="text-xs mt-1">Nhiều học viên cùng mã = 1 phiếu trả lời</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render stats tab for Thư phái cử
  const renderTpcStatsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Số lượng đăng ký thư phái cử */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SL đăng ký TPC</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{tpcStats?.total_forms || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Mỗi mã HS xin TPC = 1 thư
            </p>
          </CardContent>
        </Card>

        {/* Số lượng thư phái cử đã được duyệt */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">TPC đã được duyệt</CardTitle>
            <FileCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{tpcStats?.approved_forms || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Có ngày cấp PTL
            </p>
          </CardContent>
        </Card>

        {/* Tổng số lao động */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Số lao động</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tpcStats?.total_workers || 0}</div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-blue-600">{tpcStats?.male_workers || 0} Nam</span>
              <span className="text-pink-600">{tpcStats?.female_workers || 0} Nữ</span>
            </div>
          </CardContent>
        </Card>

        {/* Tỷ lệ giới tính */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ giới tính</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(tpcStats?.total_workers || 0) > 0 ? (
                <>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Nam {Math.round(((tpcStats?.male_workers || 0) / (tpcStats?.total_workers || 1)) * 100)}%
                  </Badge>
                  <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                    Nữ {Math.round(((tpcStats?.female_workers || 0) / (tpcStats?.total_workers || 1)) * 100)}%
                  </Badge>
                </>
              ) : (
                <span className="text-muted-foreground text-sm">Chưa có dữ liệu</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <Send className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Để thống kê, vui lòng nhập <strong>Mã HS xin TPC</strong> trong chi tiết từng đợt công ty</p>
            <p className="text-xs mt-1">Nhiều học viên cùng mã = 1 thư phái cử</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tình trạng hồ sơ</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi tình trạng hồ sơ các công ty đã tuyển dụng
          </p>
        </div>
        <div className="flex gap-2">
          {viewMode === 'list' && mainTab === 'documents' && (
            <>
              <ExportButtonWithColumns
                menuKey="legal"
                tableName="trainees"
                allColumns={EXPORT_CONFIGS.legal.columns}
                fileName={EXPORT_CONFIGS.legal.fileName}
                selectQuery="trainee_code, full_name, cccd_number, passport_number, document_status, document_submission_date, coe_date, visa_date, nyukan_entry_date"
                filters={{ progression_stage: 'Đậu phỏng vấn' }}
                title="Xuất tình trạng hồ sơ"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showStats ? "Ẩn thống kê" : "Hiện thống kê"}
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Tabs: Tình trạng HS | Số phiếu trả lời | Thư phái cử */}
      {viewMode === 'list' ? (
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="documents" className="gap-1.5">
              <FileCheck className="h-4 w-4" />
              Tình trạng HS
            </TabsTrigger>
            <TabsTrigger value="dkhd" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Số phiếu trả lời
              {(dkhdStats?.total_forms || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {dkhdStats?.total_forms}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tpc" className="gap-1.5">
              <Send className="h-4 w-4" />
              Thư phái cử
              {(tpcStats?.total_forms || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {tpcStats?.total_forms}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-6">
            {renderListView()}
          </TabsContent>

          <TabsContent value="dkhd" className="mt-6">
            {renderDkhdStatsTab()}
          </TabsContent>

          <TabsContent value="tpc" className="mt-6">
            {renderTpcStatsTab()}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {viewMode === 'type-detail' && renderTypeDetailView()}
          {viewMode === 'company-detail' && renderCompanyDetailView()}
        </>
      )}
    </div>
  );
}
