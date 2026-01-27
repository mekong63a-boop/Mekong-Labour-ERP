import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCompanies,
  useUnions,
  useJobCategories,
  useDeleteCompany,
  useDeleteUnion,
  useDeleteJobCategory,
  Company,
  Union,
  JobCategory,
} from "@/hooks/usePartners";
import { useCanAction } from "@/hooks/useMenuPermissions";
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
import {
  Building2,
  FileText,
  Briefcase,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import CompanyTraineesModal from "./CompanyTraineesModal";

type TabType = "companies" | "unions" | "job_categories";

export default function PartnerList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("companies");
  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; name: string }>({
    open: false,
    id: null,
    name: "",
  });
  
  // State for trainee counts per company
  const [traineeCounts, setTraineeCounts] = useState<Record<string, number>>({});
  
  // State for trainee modal
  const [traineeModal, setTraineeModal] = useState<{ open: boolean; companyId: string; companyName: string }>({
    open: false,
    companyId: "",
    companyName: "",
  });

  // UI: ẩn/hiện nút theo quyền menu runtime
  const { hasPermission: canCreate } = useCanAction("partners", "create");
  const { hasPermission: canUpdate } = useCanAction("partners", "update");
  const { hasPermission: canDelete } = useCanAction("partners", "delete");

  const { data: companies, isLoading: loadingCompanies, refetch: refetchCompanies } = useCompanies();
  const { data: unions, isLoading: loadingUnions, refetch: refetchUnions } = useUnions();
  const { data: jobCategories, isLoading: loadingJobs, refetch: refetchJobs } = useJobCategories();

  // Danh sách các trạng thái được tính là "đậu phỏng vấn trở về sau"
  const PASSED_STAGES = [
    "Đậu phỏng vấn",
    "Nộp hồ sơ",
    "OTIT",
    "Nyukan",
    "COE",
    "Xuất cảnh",
    "Đang làm việc",
    "Bỏ trốn",
    "Về trước hạn",
    "Hoàn thành hợp đồng",
  ] as const;

  // Fetch trainee counts for companies - CHỈ tính những học viên đã đậu phỏng vấn trở về sau
  useEffect(() => {
    const fetchTraineeCounts = async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("receiving_company_id, progression_stage")
        .not("receiving_company_id", "is", null)
        .in("progression_stage", [...PASSED_STAGES]);

      if (error) {
        console.error("Error fetching trainee counts:", error);
        return;
      }

      const counts: Record<string, number> = {};
      data?.forEach((t) => {
        if (t.receiving_company_id) {
          counts[t.receiving_company_id] = (counts[t.receiving_company_id] || 0) + 1;
        }
      });
      setTraineeCounts(counts);
    };

    fetchTraineeCounts();
  }, [companies]);

  const handleOpenTraineeModal = (companyId: string, companyName: string) => {
    setTraineeModal({ open: true, companyId, companyName });
  };

  const deleteCompany = useDeleteCompany();
  const deleteUnion = useDeleteUnion();
  const deleteJobCategory = useDeleteJobCategory();

  const tabs = [
    {
      id: "companies" as TabType,
      label: "Công ty",
      icon: Building2,
      count: companies?.length || 0,
    },
    {
      id: "unions" as TabType,
      label: "Nghiệp đoàn",
      icon: FileText,
      count: unions?.length || 0,
    },
    {
      id: "job_categories" as TabType,
      label: "Ngành nghề",
      icon: Briefcase,
      count: jobCategories?.length || 0,
    },
  ];

  const handleRefresh = () => {
    if (activeTab === "companies") refetchCompanies();
    else if (activeTab === "unions") refetchUnions();
    else refetchJobs();
  };

  const handleAdd = () => {
    if (activeTab === "companies") navigate("/partners/companies/new");
    else if (activeTab === "unions") navigate("/partners/unions/new");
    else navigate("/partners/job-categories/new");
  };

  const handleEdit = (id: string) => {
    if (activeTab === "companies") navigate(`/partners/companies/${id}/edit`);
    else if (activeTab === "unions") navigate(`/partners/unions/${id}/edit`);
    else navigate(`/partners/job-categories/${id}/edit`);
  };

  const getAddButtonLabel = () => {
    if (activeTab === "companies") return "Thêm công ty";
    if (activeTab === "unions") return "Thêm nghiệp đoàn";
    return "Thêm ngành nghề";
  };

  const getStatusColor = (status: string | null) => {
    if (status === "Đang hợp tác" || status === "Hoạt động") {
      return "bg-green-100 text-green-700 border-green-200";
    }
    return "bg-orange-100 text-orange-700 border-orange-200";
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({ open: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    
    if (activeTab === "companies") {
      await deleteCompany.mutateAsync(deleteDialog.id);
    } else if (activeTab === "unions") {
      await deleteUnion.mutateAsync(deleteDialog.id);
    } else {
      await deleteJobCategory.mutateAsync(deleteDialog.id);
    }
    
    setDeleteDialog({ open: false, id: null, name: "" });
  };

  const isLoading = loadingCompanies || loadingUnions || loadingJobs;

  // Filter data
  const filteredCompanies = companies?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.name_japanese?.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUnions = unions?.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.name_japanese?.toLowerCase().includes(search.toLowerCase()) ||
      u.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredJobCategories = jobCategories?.filter(
    (j) =>
      j.name.toLowerCase().includes(search.toLowerCase()) ||
      j.name_japanese?.toLowerCase().includes(search.toLowerCase()) ||
      j.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-primary">Quản lý Đối tác</h1>
      </div>

      {/* Tabs & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "gap-2",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "border-primary/30 text-primary hover:bg-primary/10"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <Badge
                variant="secondary"
                className={cn(
                  "ml-1",
                  activeTab === tab.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-primary/20 bg-primary/5"
            />
          </div>
          {canCreate && (
            <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              {getAddButtonLabel()}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-background rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Companies Tab */}
            {activeTab === "companies" && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[280px]">Tên công ty</TableHead>
                    <TableHead>Địa chỉ làm việc</TableHead>
                    <TableHead>Người phụ trách</TableHead>
                    <TableHead className="text-center">Số HV</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies?.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-primary">
                              {company.name_japanese || company.name}
                              {company.name_japanese && ` (${company.name})`}
                            </p>
                            <p className="text-xs text-muted-foreground">{company.code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{company.work_address || "—"}</TableCell>
                      <TableCell>{company.representative || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className="bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
                          onClick={() => handleOpenTraineeModal(company.id, company.name_japanese || company.name)}
                        >
                          {traineeCounts[company.id] || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(company.status)}>
                          {company.status || "Đang hợp tác"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(company.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(company.id, company.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Unions Tab */}
            {activeTab === "unions" && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">Mã nghiệp đoàn</TableHead>
                    <TableHead>Tên nghiệp đoàn</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>Người liên hệ</TableHead>
                    <TableHead>Điện thoại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnions?.map((union) => (
                    <TableRow key={union.id}>
                      <TableCell className="font-medium">{union.code}</TableCell>
                      <TableCell className="text-primary font-medium">
                        {union.name_japanese || union.name}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {union.address || "—"}
                      </TableCell>
                      <TableCell>{union.contact_person || "—"}</TableCell>
                      <TableCell>{union.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(union.status)}>
                          {union.status || "Đang hợp tác"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(union.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(union.id, union.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Job Categories Tab */}
            {activeTab === "job_categories" && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">Mã ngành</TableHead>
                    <TableHead>Tên ngành nghề</TableHead>
                    <TableHead>Tên tiếng Nhật</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobCategories?.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.code}</TableCell>
                      <TableCell className="text-primary font-medium">
                        {job.name}
                      </TableCell>
                      <TableCell className="text-primary">
                        {job.name_japanese || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-100">
                          {job.category || "Khác"}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.description || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "border",
                            job.status === "Hoạt động"
                              ? "bg-primary text-primary-foreground"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {job.status || "Hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(job.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(job.id, job.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa "{deleteDialog.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Company Trainees Modal */}
      <CompanyTraineesModal
        open={traineeModal.open}
        onOpenChange={(open) => setTraineeModal({ ...traineeModal, open })}
        companyId={traineeModal.companyId}
        companyName={traineeModal.companyName}
      />
    </div>
  );
}
