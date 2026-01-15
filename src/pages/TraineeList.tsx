import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Eye } from "lucide-react";
import { format, addYears } from "date-fns";

const PROGRESSION_TABS = [
  { value: "all", label: "Tất cả", key: null },
  { value: "chua_dau", label: "Chưa đậu", key: "Chưa đậu" },
  { value: "dau_pv", label: "Đậu phỏng vấn", key: "Đậu phỏng vấn" },
  { value: "nop_hs", label: "Nộp hồ sơ", key: "Nộp hồ sơ" },
  { value: "otit", label: "OTIT", key: "OTIT" },
  { value: "nyukan", label: "Nyukan", key: "Nyukan" },
  { value: "coe", label: "COE", key: "COE" },
  { value: "visa", label: "Visa", key: "Visa" },
  { value: "xuat_canh", label: "Xuất cảnh", key: "Xuất cảnh" },
  { value: "dang_lam", label: "Đang làm việc", key: "Đang làm việc" },
  { value: "bo_tron", label: "Bỏ trốn", key: "Bỏ trốn" },
  { value: "ve_truoc", label: "Về trước hạn", key: "Về trước hạn" },
  { value: "hoan_thanh", label: "Hoàn thành HĐ", key: "Hoàn thành hợp đồng" },
];

interface TraineeWithRelations {
  id: string;
  trainee_code: string;
  full_name: string;
  birth_date: string | null;
  birthplace: string | null;
  progression_stage: string | null;
  simple_status: string | null;
  enrollment_status: string | null;
  entry_date: string | null;
  interview_pass_date: string | null;
  document_submission_date: string | null;
  otit_entry_date: string | null;
  nyukan_entry_date: string | null;
  coe_date: string | null;
  departure_date: string | null;
  absconded_date: string | null;
  early_return_date: string | null;
  early_return_reason: string | null;
  return_date: string | null;
  contract_term: number | null;
  receiving_company: { name: string; name_japanese: string | null } | null;
  union: { name: string; name_japanese: string | null } | null;
  job_category: { name: string; name_japanese: string | null } | null;
}

export default function TraineeList() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Fetch trainees with relations
  const { data: trainees, isLoading, error } = useQuery({
    queryKey: ["trainees-with-relations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select(`
          id,
          trainee_code,
          full_name,
          birth_date,
          birthplace,
          progression_stage,
          simple_status,
          enrollment_status,
          entry_date,
          interview_pass_date,
          document_submission_date,
          otit_entry_date,
          nyukan_entry_date,
          coe_date,
          departure_date,
          absconded_date,
          early_return_date,
          early_return_reason,
          return_date,
          contract_term,
          receiving_company_id,
          union_id,
          job_category_id
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch related data
      const companyIds = [...new Set(data?.map(t => t.receiving_company_id).filter(Boolean))];
      const unionIds = [...new Set(data?.map(t => t.union_id).filter(Boolean))];
      const jobCategoryIds = [...new Set(data?.map(t => t.job_category_id).filter(Boolean))];

      const [companiesRes, unionsRes, jobCategoriesRes] = await Promise.all([
        companyIds.length > 0 
          ? supabase.from("companies").select("id, name, name_japanese").in("id", companyIds)
          : { data: [] },
        unionIds.length > 0
          ? supabase.from("unions").select("id, name, name_japanese").in("id", unionIds)
          : { data: [] },
        jobCategoryIds.length > 0
          ? supabase.from("job_categories").select("id, name, name_japanese").in("id", jobCategoryIds)
          : { data: [] },
      ]);

      const companiesMap = new Map((companiesRes.data || []).map(c => [c.id, c]));
      const unionsMap = new Map((unionsRes.data || []).map(u => [u.id, u]));
      const jobCategoriesMap = new Map((jobCategoriesRes.data || []).map(j => [j.id, j]));

      return data?.map(trainee => ({
        ...trainee,
        receiving_company: trainee.receiving_company_id ? companiesMap.get(trainee.receiving_company_id) || null : null,
        union: trainee.union_id ? unionsMap.get(trainee.union_id) || null : null,
        job_category: trainee.job_category_id ? jobCategoriesMap.get(trainee.job_category_id) || null : null,
      })) as TraineeWithRelations[];
    },
  });

  const filteredTrainees = useMemo(() => {
    if (!trainees) return [];

    let result = trainees;

    // Filter by tab
    const activeTabConfig = PROGRESSION_TABS.find((t) => t.value === activeTab);
    if (activeTabConfig?.key) {
      result = result.filter((t) => t.progression_stage === activeTabConfig.key);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.full_name?.toLowerCase().includes(query) ||
          t.trainee_code?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [trainees, activeTab, searchQuery]);

  const getTabCount = (key: string | null) => {
    if (!trainees) return 0;
    if (key === null) return trainees.length;
    return trainees.filter((t) => t.progression_stage === key).length;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  const getExpectedReturnDate = (departureDate: string | null, contractTerm: number | null) => {
    if (!departureDate || !contractTerm) return "—";
    try {
      const departure = new Date(departureDate);
      const returnDate = addYears(departure, contractTerm);
      return format(returnDate, "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  const getContractTermLabel = (term: number | null) => {
    if (!term) return "—";
    return `${term} năm`;
  };

  const getEnrollmentStatusBadge = (status: string | null) => {
    switch (status) {
      case "Đang học":
        return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
      case "Bảo lưu":
        return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
      case "Chưa nhập học":
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || "Chưa nhập học"}</Badge>;
    }
  };

  const getStatusBadgeClass = (stage: string | null) => {
    switch (stage) {
      case "Chưa đậu":
        return "bg-muted text-muted-foreground";
      case "Đậu phỏng vấn":
        return "bg-green-100 text-green-800";
      case "COE":
        return "bg-orange-100 text-orange-800";
      case "Visa":
        return "bg-blue-100 text-blue-800";
      case "Xuất cảnh":
      case "Đang làm việc":
        return "bg-primary/10 text-primary";
      case "Bỏ trốn":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCompanyName = (company: { name: string; name_japanese: string | null } | null) => {
    if (!company) return "—";
    return company.name_japanese ? `${company.name} (${company.name_japanese})` : company.name;
  };

  const getUnionName = (union: { name: string; name_japanese: string | null } | null) => {
    if (!union) return "—";
    return union.name_japanese ? `${union.name} (${union.name_japanese})` : union.name;
  };

  const getJobCategoryName = (jobCategory: { name: string; name_japanese: string | null } | null) => {
    if (!jobCategory) return "—";
    return jobCategory.name_japanese ? `${jobCategory.name} (${jobCategory.name_japanese})` : jobCategory.name;
  };

  // Get active tab config
  const activeTabConfig = PROGRESSION_TABS.find((t) => t.value === activeTab);

  // Render table columns based on active tab
  const renderTableHeader = () => {
    const progressionKey = activeTabConfig?.key;

    // Common columns for most stages
    const baseColumns = (
      <>
        <TableHead className="w-24">Mã HV</TableHead>
        <TableHead>Họ và tên</TableHead>
        <TableHead className="w-28">Ngày sinh</TableHead>
        <TableHead>Quê quán</TableHead>
      </>
    );

    switch (progressionKey) {
      case "Đậu phỏng vấn":
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-28">Ngày đậu PV</TableHead>
            <TableHead>Công ty tiếp nhận</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead>Ngành nghề</TableHead>
            <TableHead>Trạng thái nhập học</TableHead>
            <TableHead className="w-28">Ngày nhập học</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
      case "Nộp hồ sơ":
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-28">Ngày nộp HS</TableHead>
            <TableHead>Công ty tiếp nhận</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead>Ngành nghề</TableHead>
            <TableHead>Trạng thái nhập học</TableHead>
            <TableHead className="w-28">Ngày nhập học</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
      case "OTIT":
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-28">Ngày vào OTIT</TableHead>
            <TableHead>Công ty tiếp nhận</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead>Ngành nghề</TableHead>
            <TableHead>Trạng thái nhập học</TableHead>
            <TableHead className="w-28">Ngày nhập học</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
      case "Nyukan":
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-28">Ngày vào Nyukan</TableHead>
            <TableHead>Công ty tiếp nhận</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead>Ngành nghề</TableHead>
            <TableHead>Trạng thái nhập học</TableHead>
            <TableHead className="w-28">Ngày nhập học</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
      case "COE":
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-28">Ngày có COE</TableHead>
            <TableHead>Công ty tiếp nhận</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead>Ngành nghề</TableHead>
            <TableHead>Trạng thái nhập học</TableHead>
            <TableHead className="w-28">Ngày nhập học</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
      case "Xuất cảnh":
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-28">Ngày xuất cảnh</TableHead>
            <TableHead>Công ty tiếp nhận</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead>Ngành nghề</TableHead>
            <TableHead className="w-20">Hợp đồng</TableHead>
            <TableHead className="w-28">Ngày dự kiến về</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
      case "Đang làm việc":
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-28">Ngày xuất cảnh</TableHead>
            <TableHead>Công ty tiếp nhận</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead>Ngành nghề</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
      case "Bỏ trốn":
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-28">Ngày xuất cảnh</TableHead>
            <TableHead>Công ty tiếp nhận</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead>Ngành nghề</TableHead>
            <TableHead className="w-28">Ngày bỏ trốn</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
      case "Về trước hạn":
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-28">Ngày xuất cảnh</TableHead>
            <TableHead>Công ty tiếp nhận</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead>Ngành nghề</TableHead>
            <TableHead className="w-28">Ngày về</TableHead>
            <TableHead>Lý do về nước</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
      case "Hoàn thành hợp đồng":
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-28">Ngày xuất cảnh</TableHead>
            <TableHead>Công ty tiếp nhận</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead>Ngành nghề</TableHead>
            <TableHead className="w-28">Ngày hết HĐ</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
      default:
        // Default columns for "Tất cả" and "Chưa đậu"
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-32">Trạng thái</TableHead>
            <TableHead>Công ty</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
    }
  };

  const renderTableRow = (trainee: TraineeWithRelations) => {
    const progressionKey = activeTabConfig?.key;

    const baseColumns = (
      <>
        <TableCell className="font-mono text-sm">{trainee.trainee_code}</TableCell>
        <TableCell className="font-medium">{trainee.full_name}</TableCell>
        <TableCell className="text-sm">{formatDate(trainee.birth_date)}</TableCell>
        <TableCell className="text-sm">{trainee.birthplace || "—"}</TableCell>
      </>
    );

    const actionColumn = (
      <TableCell className="text-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/trainees/${trainee.id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    );

    switch (progressionKey) {
      case "Đậu phỏng vấn":
        return (
          <>
            {baseColumns}
            <TableCell className="text-sm">{formatDate(trainee.interview_pass_date)}</TableCell>
            <TableCell className="text-sm">{getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{getUnionName(trainee.union)}</TableCell>
            <TableCell className="text-sm">{getJobCategoryName(trainee.job_category)}</TableCell>
            <TableCell>{getEnrollmentStatusBadge(trainee.enrollment_status)}</TableCell>
            <TableCell className="text-sm">{formatDate(trainee.entry_date)}</TableCell>
            {actionColumn}
          </>
        );
      case "Nộp hồ sơ":
        return (
          <>
            {baseColumns}
            <TableCell className="text-sm">{formatDate(trainee.document_submission_date)}</TableCell>
            <TableCell className="text-sm">{getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{getUnionName(trainee.union)}</TableCell>
            <TableCell className="text-sm">{getJobCategoryName(trainee.job_category)}</TableCell>
            <TableCell>{getEnrollmentStatusBadge(trainee.enrollment_status)}</TableCell>
            <TableCell className="text-sm">{formatDate(trainee.entry_date)}</TableCell>
            {actionColumn}
          </>
        );
      case "OTIT":
        return (
          <>
            {baseColumns}
            <TableCell className="text-sm">{formatDate(trainee.otit_entry_date)}</TableCell>
            <TableCell className="text-sm">{getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{getUnionName(trainee.union)}</TableCell>
            <TableCell className="text-sm">{getJobCategoryName(trainee.job_category)}</TableCell>
            <TableCell>{getEnrollmentStatusBadge(trainee.enrollment_status)}</TableCell>
            <TableCell className="text-sm">{formatDate(trainee.entry_date)}</TableCell>
            {actionColumn}
          </>
        );
      case "Nyukan":
        return (
          <>
            {baseColumns}
            <TableCell className="text-sm">{formatDate(trainee.nyukan_entry_date)}</TableCell>
            <TableCell className="text-sm">{getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{getUnionName(trainee.union)}</TableCell>
            <TableCell className="text-sm">{getJobCategoryName(trainee.job_category)}</TableCell>
            <TableCell>{getEnrollmentStatusBadge(trainee.enrollment_status)}</TableCell>
            <TableCell className="text-sm">{formatDate(trainee.entry_date)}</TableCell>
            {actionColumn}
          </>
        );
      case "COE":
        return (
          <>
            {baseColumns}
            <TableCell className="text-sm">{formatDate(trainee.coe_date)}</TableCell>
            <TableCell className="text-sm">{getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{getUnionName(trainee.union)}</TableCell>
            <TableCell className="text-sm">{getJobCategoryName(trainee.job_category)}</TableCell>
            <TableCell>{getEnrollmentStatusBadge(trainee.enrollment_status)}</TableCell>
            <TableCell className="text-sm">{formatDate(trainee.entry_date)}</TableCell>
            {actionColumn}
          </>
        );
      case "Xuất cảnh":
        return (
          <>
            {baseColumns}
            <TableCell className="text-sm">{formatDate(trainee.departure_date)}</TableCell>
            <TableCell className="text-sm">{getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{getUnionName(trainee.union)}</TableCell>
            <TableCell className="text-sm">{getJobCategoryName(trainee.job_category)}</TableCell>
            <TableCell className="text-sm">{getContractTermLabel(trainee.contract_term)}</TableCell>
            <TableCell className="text-sm">{getExpectedReturnDate(trainee.departure_date, trainee.contract_term)}</TableCell>
            {actionColumn}
          </>
        );
      case "Đang làm việc":
        return (
          <>
            {baseColumns}
            <TableCell className="text-sm">{formatDate(trainee.departure_date)}</TableCell>
            <TableCell className="text-sm">{getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{getUnionName(trainee.union)}</TableCell>
            <TableCell className="text-sm">{getJobCategoryName(trainee.job_category)}</TableCell>
            {actionColumn}
          </>
        );
      case "Bỏ trốn":
        return (
          <>
            {baseColumns}
            <TableCell className="text-sm">{formatDate(trainee.departure_date)}</TableCell>
            <TableCell className="text-sm">{getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{getUnionName(trainee.union)}</TableCell>
            <TableCell className="text-sm">{getJobCategoryName(trainee.job_category)}</TableCell>
            <TableCell className="text-sm text-red-600 font-medium">{formatDate(trainee.absconded_date)}</TableCell>
            {actionColumn}
          </>
        );
      case "Về trước hạn":
        return (
          <>
            {baseColumns}
            <TableCell className="text-sm">{formatDate(trainee.departure_date)}</TableCell>
            <TableCell className="text-sm">{getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{getUnionName(trainee.union)}</TableCell>
            <TableCell className="text-sm">{getJobCategoryName(trainee.job_category)}</TableCell>
            <TableCell className="text-sm">{formatDate(trainee.early_return_date)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{trainee.early_return_reason || "—"}</TableCell>
            {actionColumn}
          </>
        );
      case "Hoàn thành hợp đồng":
        return (
          <>
            {baseColumns}
            <TableCell className="text-sm">{formatDate(trainee.departure_date)}</TableCell>
            <TableCell className="text-sm">{getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{getUnionName(trainee.union)}</TableCell>
            <TableCell className="text-sm">{getJobCategoryName(trainee.job_category)}</TableCell>
            <TableCell className="text-sm text-green-600 font-medium">{formatDate(trainee.return_date)}</TableCell>
            {actionColumn}
          </>
        );
      default:
        // Default columns for "Tất cả" and "Chưa đậu"
        return (
          <>
            {baseColumns}
            <TableCell>
              <Badge className={getStatusBadgeClass(trainee.progression_stage)}>
                {trainee.progression_stage || "Chưa đậu"}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">{getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{getUnionName(trainee.union)}</TableCell>
            {actionColumn}
          </>
        );
    }
  };

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        Lỗi khi tải dữ liệu: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Học viên</h1>
          <p className="text-muted-foreground text-sm">
            Theo dõi và quản lý danh sách học viên
          </p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/trainees/new")}>
          <Plus className="h-4 w-4" />
          Thêm mới
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {PROGRESSION_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-3 py-1.5"
            >
              {tab.label} ({getTabCount(tab.key)})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc mã học viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredTrainees.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          Không có học viên nào
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              {renderTableHeader()}
            </TableHeader>
            <TableBody>
              {filteredTrainees.map((trainee) => (
                <TableRow
                  key={trainee.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/trainees/${trainee.id}`)}
                >
                  {renderTableRow(trainee)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
