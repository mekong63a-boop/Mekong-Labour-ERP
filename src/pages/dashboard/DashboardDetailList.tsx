import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye } from "lucide-react";
import { format } from "date-fns";

// Filter type definitions
type FilterType = 
  | "registered_new"
  | "not_studying"
  | "studying"
  | "reserved"
  | "cancelled"
  | "passed_interview"
  | "departed_tts"
  | "departed_tts3"
  | "departed_student"
  | "departed_knd"
  | "departed_engineer"
  | "departed_total";

const FILTER_TITLES: Record<FilterType, string> = {
  registered_new: "Đăng ký mới",
  not_studying: "Chưa học",
  studying: "Đang học",
  reserved: "Bảo lưu",
  cancelled: "Hủy",
  passed_interview: "Đậu phỏng vấn",
  departed_tts: "Thực tập sinh xuất cảnh",
  departed_tts3: "Thực tập sinh số 3 xuất cảnh",
  departed_student: "Du học sinh xuất cảnh",
  departed_knd: "Kỹ năng đặc định xuất cảnh",
  departed_engineer: "Kỹ sư xuất cảnh",
  departed_total: "Tổng xuất cảnh",
};

// Dynamic column definitions based on filter type
const getDynamicColumn = (filter: FilterType): { label: string; field: string } => {
  switch (filter) {
    case "registered_new":
      return { label: "Ngày đăng ký", field: "registration_date" };
    case "not_studying":
      return { label: "Ngày đăng ký", field: "registration_date" };
    case "studying":
      return { label: "Ngày nhập học", field: "entry_date" };
    case "reserved":
      return { label: "Trạng thái", field: "enrollment_status" };
    case "cancelled":
      return { label: "Trạng thái", field: "simple_status" };
    case "passed_interview":
      return { label: "Ngày đậu PV", field: "interview_pass_date" };
    case "departed_tts":
    case "departed_tts3":
    case "departed_student":
    case "departed_knd":
    case "departed_engineer":
    case "departed_total":
      return { label: "Ngày xuất cảnh", field: "departure_date" };
    default:
      return { label: "Ngày đăng ký", field: "registration_date" };
  }
};

// Check if filter is for "Số liệu đầu ra" (Output Data)
const isOutputDataFilter = (filter: FilterType): boolean => {
  return filter.startsWith("departed_");
};

// Check if filter is for students
const isStudentFilter = (filter: FilterType): boolean => {
  return filter === "departed_student";
};

export default function DashboardDetailList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const filter = searchParams.get("filter") as FilterType | null;
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  // Determine if we need extra columns for output data
  const showOutputColumns = filter && isOutputDataFilter(filter);
  const showSchoolColumn = filter && isStudentFilter(filter);

  // Fetch trainees based on filter - include related data for output filters
  const { data: trainees = [], isLoading } = useQuery({
    queryKey: ["dashboard-detail-list", filter, year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select(`
          id,
          trainee_code,
          full_name,
          birth_date,
          gender,
          birthplace,
          registration_date,
          entry_date,
          interview_pass_date,
          departure_date,
          trainee_type,
          progression_stage,
          simple_status,
          enrollment_status,
          created_at,
          receiving_company_id,
          union_id,
          job_category_id,
          class_id
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!filter,
  });

  // Fetch companies for output data
  const { data: companies = [] } = useQuery({
    queryKey: ["dashboard-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!showOutputColumns,
  });

  // Fetch unions for output data
  const { data: unions = [] } = useQuery({
    queryKey: ["dashboard-unions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unions")
        .select("id, name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!showOutputColumns,
  });

  // Fetch job categories for output data
  const { data: jobCategories = [] } = useQuery({
    queryKey: ["dashboard-job-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_categories")
        .select("id, name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!showOutputColumns,
  });

  // Fetch classes for students (school name)
  const { data: classes = [] } = useQuery({
    queryKey: ["dashboard-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!showSchoolColumn,
  });

  // Create lookup maps
  const companyMap = useMemo(() => {
    const map: Record<string, string> = {};
    companies.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [companies]);

  const unionMap = useMemo(() => {
    const map: Record<string, string> = {};
    unions.forEach(u => { map[u.id] = u.name; });
    return map;
  }, [unions]);

  const jobCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    jobCategories.forEach(j => { map[j.id] = j.name; });
    return map;
  }, [jobCategories]);

  const classMap = useMemo(() => {
    const map: Record<string, string> = {};
    classes.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [classes]);

  // Filter trainees based on the filter type and date range
  const filteredTrainees = useMemo(() => {
    if (!filter) return [];

    const matchesDateFilter = (dateStr: string | null) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      const dateYear = date.getFullYear();
      const dateMonth = date.getMonth() + 1;
      
      if (year && year !== "all" && dateYear !== parseInt(year)) return false;
      if (month && month !== "all" && dateMonth !== parseInt(month)) return false;
      
      return true;
    };

    return trainees.filter((t) => {
      // Determine which date field to use for filtering
      const useRegistrationDate = ["registered_new", "not_studying", "studying", "reserved", "cancelled"].includes(filter);
      const useInterviewDate = filter === "passed_interview";
      const useDepartureDate = filter.startsWith("departed_");
      
      // Apply date filter based on category
      if (useRegistrationDate && year && year !== "all") {
        const regDate = t.registration_date || t.created_at;
        if (!matchesDateFilter(regDate)) return false;
      }
      
      if (useInterviewDate && year && year !== "all") {
        // Đậu phỏng vấn: lọc theo interview_pass_date
        if (!matchesDateFilter(t.interview_pass_date)) return false;
      }
      
      if (useDepartureDate && year && year !== "all") {
        if (!matchesDateFilter(t.departure_date)) return false;
      }

      // Apply category filter
      switch (filter) {
        case "registered_new":
          return true; // Already filtered by date
        case "not_studying":
          return !t.enrollment_status || t.enrollment_status === "Chưa học";
        case "studying":
          return t.enrollment_status === "Đang học" || t.simple_status === "Đang học";
        case "reserved":
          return t.enrollment_status === "Bảo lưu" || t.simple_status === "Bảo lưu";
        case "cancelled":
          return t.simple_status === "Hủy" || t.enrollment_status === "Đã hủy";
        case "passed_interview":
          // Phải có interview_pass_date HOẶC progression_stage cho thấy đã đậu, VÀ chưa xuất cảnh
          const hasPassed = t.interview_pass_date || (t.progression_stage && !["Chưa đậu", "Tuyển dụng"].includes(t.progression_stage as string));
          return hasPassed && !t.departure_date; // Chưa xuất cảnh
        case "departed_tts":
          return t.departure_date && t.trainee_type === "Thực tập sinh";
        case "departed_tts3":
          return t.departure_date && t.trainee_type === "Thực tập sinh số 3";
        case "departed_student":
          return t.departure_date && t.trainee_type === "Du học sinh";
        case "departed_knd":
          return t.departure_date && t.trainee_type === "Kỹ năng đặc định";
        case "departed_engineer":
          return t.departure_date && t.trainee_type === "Kỹ sư";
        case "departed_total":
          return !!t.departure_date;
        default:
          return true;
      }
    });
  }, [trainees, filter, year, month]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  // Extract province from birthplace
  const getProvince = (birthplace: string | null) => {
    if (!birthplace) return "—";
    // Try to extract province (usually last part after comma)
    const parts = birthplace.split(",");
    return parts[parts.length - 1]?.trim() || birthplace;
  };

  const dynamicColumn = filter ? getDynamicColumn(filter) : null;

  // Calculate colspan for empty state
  const getColspan = () => {
    let base = 7; // Base columns: Mã HV, Họ tên, Ngày sinh, Giới tính, Quê quán, Dynamic, Thao tác
    // Add Ngày ĐK if not Chưa học/Đang học
    if (filter !== "not_studying" && filter !== "studying") base += 1;
    // Add Ngày nhập học if not Đăng ký mới/Chưa học and dynamic is not entry_date
    const dynField = filter ? getDynamicColumn(filter).field : null;
    if (filter !== "registered_new" && filter !== "not_studying" && dynField !== "entry_date") base += 1;
    // Add output columns
    if (showOutputColumns) {
      base += showSchoolColumn ? 1 : 3;
    }
    return base;
  };

  if (!filter) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => navigate("/dashboard/trainees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại Dashboard
        </Button>
        <p className="mt-4 text-muted-foreground">Không có bộ lọc được chọn.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/trainees")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-xl font-bold">{FILTER_TITLES[filter]}</h1>
            <p className="text-sm text-muted-foreground">
              {year && year !== "all" ? `Năm ${year}` : "Tất cả năm"}
              {month && month !== "all" ? ` - Tháng ${month}` : ""}
              {" • "}
              {filteredTrainees.length} học viên
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-24">Mã HV</TableHead>
                  <TableHead className="min-w-[140px]">Họ và tên</TableHead>
                  <TableHead className="w-24">Ngày sinh</TableHead>
                  <TableHead className="w-16">Giới tính</TableHead>
                  <TableHead className="min-w-[100px]">Quê quán</TableHead>
                  {/* Chỉ hiển thị Ngày ĐK nếu không phải Chưa học/Đang học */}
                  {filter !== "not_studying" && filter !== "studying" && (
                    <TableHead className="w-24">Ngày ĐK</TableHead>
                  )}
                  {/* Chỉ hiển thị Ngày nhập học nếu không phải Đăng ký mới/Chưa học và dynamic không phải entry_date */}
                  {filter !== "registered_new" && filter !== "not_studying" && dynamicColumn?.field !== "entry_date" && (
                    <TableHead className="w-24">Ngày nhập học</TableHead>
                  )}
                  <TableHead className="w-28">{dynamicColumn?.label || "—"}</TableHead>
                  {/* Additional columns for output data */}
                  {showOutputColumns && !showSchoolColumn && (
                    <>
                      <TableHead className="min-w-[120px]">Công ty</TableHead>
                      <TableHead className="min-w-[120px]">Nghiệp đoàn</TableHead>
                      <TableHead className="min-w-[100px]">Ngành nghề</TableHead>
                    </>
                  )}
                  {showSchoolColumn && (
                    <TableHead className="min-w-[120px]">Tên trường</TableHead>
                  )}
                  <TableHead className="w-20 text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={getColspan()} className="text-center py-8 text-muted-foreground">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrainees.map((trainee) => (
                    <TableRow
                      key={trainee.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/trainees/${trainee.id}`)}
                    >
                      <TableCell className="font-mono text-sm">{trainee.trainee_code}</TableCell>
                      <TableCell className="font-medium">{trainee.full_name}</TableCell>
                      <TableCell className="text-sm">{formatDate(trainee.birth_date)}</TableCell>
                      <TableCell className={`text-sm font-medium ${trainee.gender === 'Nữ' ? 'text-red-600' : trainee.gender === 'Nam' ? 'text-blue-600' : ''}`}>
                        {trainee.gender || "—"}
                      </TableCell>
                      <TableCell className="text-sm">{getProvince(trainee.birthplace)}</TableCell>
                      {/* Chỉ hiển thị Ngày ĐK nếu không phải Chưa học/Đang học */}
                      {filter !== "not_studying" && filter !== "studying" && (
                        <TableCell className="text-sm">
                          {formatDate(trainee.registration_date || trainee.created_at)}
                        </TableCell>
                      )}
                      {/* Chỉ hiển thị Ngày nhập học nếu không phải Đăng ký mới/Chưa học và dynamic không phải entry_date */}
                      {filter !== "registered_new" && filter !== "not_studying" && dynamicColumn?.field !== "entry_date" && (
                        <TableCell className="text-sm">{formatDate(trainee.entry_date)}</TableCell>
                      )}
                      <TableCell className="text-sm">
                        {dynamicColumn?.field === "registration_date" && formatDate(trainee.registration_date)}
                        {dynamicColumn?.field === "entry_date" && formatDate(trainee.entry_date)}
                        {dynamicColumn?.field === "interview_pass_date" && formatDate(trainee.interview_pass_date)}
                        {dynamicColumn?.field === "departure_date" && formatDate(trainee.departure_date)}
                        {dynamicColumn?.field === "enrollment_status" && (trainee.enrollment_status || "—")}
                        {dynamicColumn?.field === "simple_status" && (trainee.simple_status || "—")}
                      </TableCell>
                      {/* Additional data for output data */}
                      {showOutputColumns && !showSchoolColumn && (
                        <>
                          <TableCell className="text-sm">
                            {trainee.receiving_company_id ? companyMap[trainee.receiving_company_id] || "—" : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {trainee.union_id ? unionMap[trainee.union_id] || "—" : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {trainee.job_category_id ? jobCategoryMap[trainee.job_category_id] || "—" : "—"}
                          </TableCell>
                        </>
                      )}
                      {showSchoolColumn && (
                        <TableCell className="text-sm">
                          {trainee.class_id ? classMap[trainee.class_id] || "—" : "—"}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
