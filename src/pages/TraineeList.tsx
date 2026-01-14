import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTrainees } from "@/hooks/useTrainees";
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
import { format } from "date-fns";
import { Constants } from "@/integrations/supabase/types";

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

export default function TraineeList() {
  const { data: trainees, isLoading, error } = useTrainees();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        Lỗi khi tải dữ liệu: {error.message}
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
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-24">Mã HV</TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead className="w-28">Ngày sinh</TableHead>
                <TableHead className="w-20">Số lần PV</TableHead>
                <TableHead>Lớp học</TableHead>
                <TableHead className="w-32">Trạng thái</TableHead>
                <TableHead>Công ty</TableHead>
                <TableHead className="w-20 text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrainees.map((trainee) => (
                <TableRow
                  key={trainee.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/trainees/${trainee.id}`)}
                >
                  <TableCell className="font-mono text-sm">
                    {trainee.trainee_code}
                  </TableCell>
                  <TableCell className="font-medium">{trainee.full_name}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(trainee.birth_date)}
                  </TableCell>
                  <TableCell className="text-center">
                    {(trainee as any).interview_count || 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">—</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(trainee.progression_stage)}>
                      {trainee.progression_stage || "Chưa đậu"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">—</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
