import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Eye, RefreshCw, Trash2, Lock, LockOpen } from "lucide-react";
import { addYears } from "date-fns";
import { formatVietnameseDate } from "@/lib/vietnamese-utils";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useTraineesPaginated, TraineeListItem } from "@/hooks/useTraineesPaginated";
import { useTraineeStageCounts } from "@/hooks/useTraineeStageCounts";
import { useDeleteTrainee, useToggleTraineeLock } from "@/hooks/useTrainees";
import { useUserRole } from "@/hooks/useUserRole";
import { useCanAction } from "@/hooks/useMenuPermissions";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useToast } from "@/hooks/use-toast";
import { StageTabsGrid, STAGE_TABS } from "@/components/trainees/StageTabsGrid";
import { ExportButtonWithColumns } from "@/components/ui/export-button-with-columns";
import { EXPORT_CONFIGS } from "@/lib/export-configs";

export default function TraineeList() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [traineeToDelete, setTraineeToDelete] = useState<TraineeListItem | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission: canDelete } = useCanAction("trainees", "delete");
  const deleteTrainee = useDeleteTrainee();
  const toggleLockMutation = useToggleTraineeLock();
  const { isAdmin } = useUserRole();
  
  // Debounce search query (300ms delay)
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Pagination state
  const pagination = usePagination({ pageSize: 50 });
  
  // Fetch stage counts for tabs
  const { data: stageCounts, isLoading: isCountsLoading } = useTraineeStageCounts();
  
  // Get current progression stage for filtering (from hardcoded tabs)
  const activeTabConfig = STAGE_TABS.find((t) => t.value === activeTab);
  const progressionStage = activeTabConfig?.key === 'all' ? 'all' : activeTabConfig?.key || 'all';
  
  // Fetch trainees with pagination
  const { 
    trainees, 
    totalCount, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useTraineesPaginated({
    from: pagination.from,
    to: pagination.to,
    progressionStage,
    searchQuery: debouncedSearch,
  });
  
  // Update total items when count changes
  useEffect(() => {
    pagination.setTotalItems(totalCount);
  }, [totalCount]);
  
  // Reset to page 1 when tab or search changes
  useEffect(() => {
    pagination.goToPage(1);
  }, [activeTab, debouncedSearch]);
  
  // Show error toast
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const handleDeleteTrainee = async () => {
    if (!traineeToDelete) return;
    
    try {
      await deleteTrainee.mutateAsync(traineeToDelete.id);
      toast({ title: "Đã xóa học viên thành công" });
      setDeleteDialogOpen(false);
      setTraineeToDelete(null);
    } catch (error) {
      toast({ title: "Lỗi khi xóa học viên", variant: "destructive" });
    }
  };

  const openDeleteDialog = (trainee: TraineeListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setTraineeToDelete(trainee);
    setDeleteDialogOpen(true);
  };

  const formatDate = formatVietnameseDate;

  const getExpectedReturnDate = (departureDate: string | null, contractTerm: number | null) => {
    if (!departureDate || !contractTerm) return "—";
    try {
      const departure = new Date(departureDate);
      const returnDate = addYears(departure, contractTerm);
      return formatVietnameseDate(returnDate.toISOString());
    } catch {
      return "—";
    }
  };

  const getContractTermLabel = (term: number | null) => {
    if (!term) return "—";
    if (term === 0.5) return "6 tháng";
    return `${term} năm`;
  };

  const getStatusBadgeClass = (stage: string | null) => {
    switch (stage) {
      case "ChuaDau":
        return "bg-muted text-muted-foreground";
      case "DauPV":
        return "bg-green-100 text-green-800";
      case "NopHS":
        return "bg-blue-100 text-blue-800";
      case "OTIT":
        return "bg-cyan-100 text-cyan-800";
      case "Nyukan":
        return "bg-indigo-100 text-indigo-800";
      case "COE":
        return "bg-orange-100 text-orange-800";
      case "Visa":
        return "bg-purple-100 text-purple-800";
      case "DaXuatCanh":
      case "DangLamViec":
        return "bg-primary/10 text-primary";
      case "HoanThanhHD":
        return "bg-emerald-100 text-emerald-800";
      case "BoTron":
        return "bg-red-100 text-red-800";
      case "VeNuocSom":
        return "bg-yellow-100 text-yellow-800";
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

  // Render table columns based on active tab
  const renderTableHeader = () => {
    const progressionKey = activeTabConfig?.key;

    // Common columns for most stages
    const baseColumns = (
      <>
        <TableHead className="w-24">Mã HV</TableHead>
        <TableHead className="min-w-[140px]">Họ và tên</TableHead>
        <TableHead className="w-24">Ngày sinh</TableHead>
        <TableHead className="w-16">Giới tính</TableHead>
        <TableHead className="min-w-[100px]">Quê quán</TableHead>
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
      case "Chưa đậu":
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-32">Tình trạng</TableHead>
            <TableHead className="w-28">Ngày đăng ký</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
      default:
        // Default columns for "Tất cả"
        return (
          <TableRow className="bg-muted/50">
            {baseColumns}
            <TableHead className="w-32">Trạng thái</TableHead>
            <TableHead className="w-28">Tình trạng</TableHead>
            <TableHead>Công ty</TableHead>
            <TableHead>Nghiệp đoàn</TableHead>
            <TableHead className="w-20 text-center">Thao tác</TableHead>
          </TableRow>
        );
    }
  };

  const renderTableRow = (trainee: TraineeListItem) => {
    const progressionKey = activeTabConfig?.key;

    const baseColumns = (
      <>
        <TableCell className="font-mono text-sm">{trainee.trainee_code}</TableCell>
        <TableCell className="font-medium">
          <span className="flex items-center gap-1.5">
            {trainee.full_name}
            {trainee.is_locked && (
              <Lock className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
          </span>
        </TableCell>
        <TableCell className="text-sm">{formatDate(trainee.birth_date)}</TableCell>
        <TableCell className={`text-sm font-medium ${trainee.gender === 'Nữ' ? 'text-red-600' : trainee.gender === 'Nam' ? 'text-blue-600' : ''}`}>
          {trainee.gender || "—"}
        </TableCell>
        <TableCell className="text-sm">{trainee.birthplace || "—"}</TableCell>
      </>
    );

    const actionColumn = (
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/trainees/${trainee.id}`);
            }}
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canDelete && !trainee.is_locked && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => openDeleteDialog(trainee, e)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Xóa học viên"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleLockMutation.mutate({ id: trainee.id, is_locked: !trainee.is_locked });
              }}
              disabled={toggleLockMutation.isPending}
              title={trainee.is_locked ? "Mở khóa hồ sơ" : "Khóa hồ sơ"}
              className={trainee.is_locked ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-foreground"}
            >
              {trainee.is_locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            </Button>
          )}
        </div>
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
      case "Chưa đậu":
        return (
          <>
            {baseColumns}
            <TableCell>
              <Badge variant="outline">{trainee.simple_status || "Đăng ký mới"}</Badge>
            </TableCell>
            <TableCell className="text-sm">{formatDate(trainee.registration_date)}</TableCell>
            {actionColumn}
          </>
        );
      default:
        // Default columns for "Tất cả"
        const isNotPassed = !trainee.progression_stage || trainee.progression_stage === "ChuaDau";
        return (
          <>
            {baseColumns}
            <TableCell>
              <Badge className={getStatusBadgeClass(trainee.progression_stage)}>
                {trainee.progression_stage || "Chưa đậu"}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{trainee.simple_status || "Đăng ký mới"}</Badge>
            </TableCell>
            <TableCell className="text-sm">{isNotPassed ? "—" : getCompanyName(trainee.receiving_company)}</TableCell>
            <TableCell className="text-sm">{isNotPassed ? "—" : getUnionName(trainee.union)}</TableCell>
            {actionColumn}
          </>
        );
    }
  };

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
        <div className="flex items-center gap-2">
          <ExportButtonWithColumns
            menuKey="trainees"
            tableName="trainees"
            allColumns={EXPORT_CONFIGS.trainees.columns}
            fileName={EXPORT_CONFIGS.trainees.fileName}
            selectQuery={`
              trainee_code, full_name, birth_date, gender, birthplace,
              phone, cccd_number, passport_number,
              progression_stage, simple_status, trainee_type,
              departure_date, entry_date, interview_pass_date, registration_date,
              receiving_company:companies(name),
              union:unions(name),
              job_category:job_categories(name)
            `}
            filters={progressionStage !== 'all' ? { progression_stage: progressionStage } : undefined}
            title="Xuất danh sách học viên"
          />
          <Button className="gap-2" onClick={() => navigate("/trainees/new")}>
            <Plus className="h-4 w-4" />
            Thêm mới
          </Button>
        </div>
      </div>

      {/* Tabs - HARDCODED, không sinh từ ENUM */}
      <StageTabsGrid
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stageCounts={stageCounts}
        isLoading={isCountsLoading}
      />

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, mã học viên hoặc quê quán..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {debouncedSearch !== searchQuery && (
          <span className="text-xs text-muted-foreground">Đang tìm kiếm...</span>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="text-center py-8 border rounded-lg bg-destructive/5">
          <p className="text-destructive mb-4">Lỗi khi tải dữ liệu: {error?.message}</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      )}

      {/* Table */}
      {!isError && (
        <>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : trainees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              {debouncedSearch ? (
                <>
                  Không tìm thấy học viên phù hợp với từ khóa "<span className="font-medium">{debouncedSearch}</span>"
                </>
              ) : (
                "Không có học viên nào trong danh mục này"
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  {renderTableHeader()}
                </TableHeader>
                <TableBody>
                  {trainees.map((trainee) => (
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

          {/* Pagination */}
          {!isLoading && trainees.length > 0 && (
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              from={pagination.from}
              to={pagination.to}
              pageSize={pagination.pageSize}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
              isLoading={isLoading}
            />
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa học viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa học viên <strong>{traineeToDelete?.full_name}</strong> ({traineeToDelete?.trainee_code})? 
              Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTrainee}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTrainee.isPending}
            >
              {deleteTrainee.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
