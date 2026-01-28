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
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Search, Building2, Users, FileCheck, FileClock, FileX, GraduationCap, Wrench, UserCheck, ChevronDown, ChevronLeft, BarChart3 } from "lucide-react";
import { removeVietnameseDiacritics, formatJapaneseDate } from "@/lib/vietnamese-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  progression_stage: string | null;
  document_status: string | null;
  education_history: Array<{
    school_name: string;
    level: string | null;
    start_year: number | null;
    end_year: number | null;
  }> | null;
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

// 35 columns for the document checklist table
const DOCUMENT_COLUMNS = [
  'STT', 'Mã HV', 'Họ và tên', 'Họ và tên không dấu', 'Tên phiên âm', 
  'Giới tính', 'Ngày tháng năm sinh', 'Ngày sinh tiếng Nhật',
  'Nơi sinh', 'Nơi sinh không dấu', 
  'Số hộ chiếu', 'Ngày cấp HC', 'Ngày cấp HC (JP)',
  'Ngày dự kiến XC', 'Ngày dự kiến XC (JP)',
  'Địa chỉ Việt', 'Địa chỉ Nhật',
  'Tên người bảo lãnh VN', 'Tên người bảo lãnh JP', 'SĐT người bảo lãnh',
  'Tên trường cấp 3', 'Thời gian học',
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
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCompanyBatch, setSelectedCompanyBatch] = useState<CompanyBatch | null>(null);

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

  // Query trainees by selected type - match view logic: only document processing stages
  const { data: traineesByType = [], isLoading: isLoadingTrainees } = useQuery({
    queryKey: ["legal-trainees-by-type", selectedType],
    queryFn: async () => {
      if (!selectedType) return [];
      
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
        .not("interview_pass_date", "is", null)
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
    queryKey: ["legal-company-trainees", selectedCompanyBatch?.company_id, selectedCompanyBatch?.interview_pass_date],
    queryFn: async () => {
      if (!selectedCompanyBatch) return [];
      
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
          progression_stage,
          document_status,
          education_history (
            school_name,
            level,
            start_year,
            end_year
          )
        `)
        .eq("receiving_company_id", selectedCompanyBatch.company_id)
        .eq("interview_pass_date", selectedCompanyBatch.interview_pass_date)
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

  // Helper to format high school education period (2002年09月~2005年06月)
  const formatEducationPeriod = (trainee: CompanyTrainee) => {
    if (!trainee.education_history || trainee.education_history.length === 0) return "—";
    
    // Find high school level education
    const highSchool = trainee.education_history.find(
      edu => edu.level?.toLowerCase().includes('cấp 3') || 
             edu.level?.toLowerCase().includes('thpt') ||
             edu.level?.toLowerCase().includes('trung học phổ thông') ||
             edu.level?.toLowerCase().includes('phổ thông')
    ) || trainee.education_history[0];
    
    if (!highSchool) return "—";
    
    const startYear = highSchool.start_year;
    const endYear = highSchool.end_year;
    
    if (!startYear && !endYear) return "—";
    
    // Format as 2002年09月~2005年06月 (assuming September start, June end)
    const startStr = startYear ? `${startYear}年09月` : "";
    const endStr = endYear ? `${endYear}年06月` : "";
    
    if (startStr && endStr) return `${startStr}~${endStr}`;
    if (startStr) return `${startStr}~`;
    if (endStr) return `~${endStr}`;
    return "—";
  };

  // Helper to get high school name
  const getHighSchoolName = (trainee: CompanyTrainee) => {
    if (!trainee.education_history || trainee.education_history.length === 0) return "—";
    
    const highSchool = trainee.education_history.find(
      edu => edu.level?.toLowerCase().includes('cấp 3') || 
             edu.level?.toLowerCase().includes('thpt') ||
             edu.level?.toLowerCase().includes('trung học phổ thông') ||
             edu.level?.toLowerCase().includes('phổ thông')
    ) || trainee.education_history[0];
    
    return highSchool?.school_name || "—";
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
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
          <div>
            <CardTitle className="text-base">{selectedCompanyBatch?.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedCompanyBatch?.name_japanese && `${selectedCompanyBatch.name_japanese} • `}
              Ngày PV: {selectedCompanyBatch?.interview_pass_date && 
                format(new Date(selectedCompanyBatch.interview_pass_date), "dd/MM/yyyy", { locale: vi })}
            </p>
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
                      <TableCell className="whitespace-nowrap">
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
                      <TableCell className="whitespace-nowrap">
                        {trainee.birthplace || "—"}
                      </TableCell>
                      {/* Nơi sinh không dấu */}
                      <TableCell className="whitespace-nowrap">
                        {trainee.birthplace ? removeVietnameseDiacritics(trainee.birthplace) : "—"}
                      </TableCell>
                      {/* Số hộ chiếu */}
                      <TableCell className="font-mono text-xs">
                        {trainee.passport_number || "—"}
                      </TableCell>
                      {/* Ngày cấp hộ chiếu */}
                      <TableCell className="whitespace-nowrap">
                        {trainee.passport_date 
                          ? format(new Date(trainee.passport_date), "dd/MM/yyyy", { locale: vi })
                          : "—"}
                      </TableCell>
                      {/* Ngày cấp hộ chiếu tiếng Nhật */}
                      <TableCell className="whitespace-nowrap">
                        {formatJapaneseDate(trainee.passport_date)}
                      </TableCell>
                      {/* Ngày dự kiến XC */}
                      <TableCell className="whitespace-nowrap">
                        {trainee.expected_entry_month || "—"}
                      </TableCell>
                      {/* Ngày dự kiến XC tiếng Nhật */}
                      <TableCell className="whitespace-nowrap">
                        {trainee.expected_entry_month 
                          ? formatJapaneseDate(trainee.expected_entry_month)
                          : "—"}
                      </TableCell>
                      {/* Địa chỉ Việt - editable */}
                      <TableCell className="min-w-[150px]">
                        <Input
                          className="h-7 text-xs"
                          defaultValue={trainee.legal_address_vn || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "legal_address_vn", e.target.value)}
                          placeholder="Nhập địa chỉ VN"
                        />
                      </TableCell>
                      {/* Địa chỉ Nhật - editable */}
                      <TableCell className="min-w-[150px]">
                        <Input
                          className="h-7 text-xs"
                          defaultValue={trainee.legal_address_jp || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "legal_address_jp", e.target.value)}
                          placeholder="日本住所"
                        />
                      </TableCell>
                      {/* Tên người bảo lãnh VN - editable */}
                      <TableCell className="min-w-[120px]">
                        <Input
                          className="h-7 text-xs"
                          defaultValue={trainee.guarantor_name_vn || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "guarantor_name_vn", e.target.value)}
                          placeholder="Tên BL VN"
                        />
                      </TableCell>
                      {/* Tên người bảo lãnh JP - editable */}
                      <TableCell className="min-w-[120px]">
                        <Input
                          className="h-7 text-xs"
                          defaultValue={trainee.guarantor_name_jp || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "guarantor_name_jp", e.target.value)}
                          placeholder="保証人名"
                        />
                      </TableCell>
                      {/* SĐT người bảo lãnh - editable */}
                      <TableCell className="min-w-[100px]">
                        <Input
                          className="h-7 text-xs font-mono"
                          defaultValue={trainee.guarantor_phone || ""}
                          onBlur={(e) => handleLegalFieldBlur(trainee.id, "guarantor_phone", e.target.value)}
                          placeholder="SĐT"
                        />
                      </TableCell>
                      {/* Tên trường cấp 3 */}
                      <TableCell className="whitespace-nowrap text-xs">
                        {getHighSchoolName(trainee)}
                      </TableCell>
                      {/* Thời gian học */}
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatEducationPeriod(trainee)}
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

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tình trạng hồ sơ</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi tình trạng hồ sơ các công ty đã tuyển dụng
          </p>
        </div>
        {viewMode === 'list' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showStats ? "Ẩn thống kê" : "Hiện thống kê"}
          </Button>
        )}
      </header>

      {viewMode === 'list' && renderListView()}
      {viewMode === 'type-detail' && renderTypeDetailView()}
      {viewMode === 'company-detail' && renderCompanyDetailView()}
    </div>
  );
}
