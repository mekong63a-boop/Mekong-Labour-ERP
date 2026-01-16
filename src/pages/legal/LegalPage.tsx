import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, Download, Building2, FileText, Users, Plane } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface CompanyWithTrainees {
  id: string;
  code: string;
  name: string;
  name_japanese: string | null;
  address: string | null;
  work_address: string | null;
  last_interview_date: string | null;
  doing_paperwork: number;
  departed: number;
  total_passed: number;
}

export default function LegalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch companies with trainees who passed interview
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies-with-trainees"],
    queryFn: async () => {
      // Get all trainees with interview_pass_date (means they passed)
      const { data: trainees, error: traineesError } = await supabase
        .from("trainees")
        .select(`
          id,
          receiving_company_id,
          progression_stage,
          interview_pass_date
        `)
        .not("receiving_company_id", "is", null)
        .not("interview_pass_date", "is", null);

      if (traineesError) throw traineesError;

      // Get unique company IDs
      const companyIds = [...new Set(trainees?.map(t => t.receiving_company_id).filter(Boolean) as string[])];

      if (companyIds.length === 0) {
        return [];
      }

      // Fetch company details
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, code, name, name_japanese, address, work_address")
        .in("id", companyIds);

      if (companiesError) throw companiesError;

      // Get interview history for last interview dates
      const { data: interviews, error: interviewsError } = await supabase
        .from("interview_history")
        .select("company_id, interview_date")
        .in("company_id", companyIds)
        .not("interview_date", "is", null)
        .order("interview_date", { ascending: false });

      if (interviewsError) throw interviewsError;

      // Build company map with stats
      const result: CompanyWithTrainees[] = companiesData?.map(company => {
        const companyTrainees = trainees?.filter(t => t.receiving_company_id === company.id) || [];
        
        // Count by progression stage
        const doingPaperworkStages = ["Đậu phỏng vấn", "Nộp hồ sơ", "OTIT", "Nyukan", "COE", "Visa"];
        const departedStages = ["Xuất cảnh", "Đang làm việc", "Hoàn thành hợp đồng"];
        
        const doingPaperwork = companyTrainees.filter(t => 
          t.progression_stage && doingPaperworkStages.includes(t.progression_stage)
        ).length;
        
        const departed = companyTrainees.filter(t => 
          t.progression_stage && departedStages.includes(t.progression_stage)
        ).length;

        // Get last interview date for this company
        const companyInterviews = interviews?.filter(i => i.company_id === company.id) || [];
        const lastInterviewDate = companyInterviews[0]?.interview_date || null;

        return {
          id: company.id,
          code: company.code,
          name: company.name,
          name_japanese: company.name_japanese,
          address: company.address,
          work_address: company.work_address,
          last_interview_date: lastInterviewDate,
          doing_paperwork: doingPaperwork,
          departed: departed,
          total_passed: companyTrainees.length,
        };
      }) || [];

      // Sort by total passed (descending)
      return result.sort((a, b) => b.total_passed - a.total_passed);
    },
  });

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.name_japanese?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "paperwork") return matchesSearch && company.doing_paperwork > 0;
    if (statusFilter === "departed") return matchesSearch && company.departed > 0;
    
    return matchesSearch;
  });

  // Stats
  const totalPaperwork = companies.reduce((sum, c) => sum + c.doing_paperwork, 0);
  const totalDeparted = companies.reduce((sum, c) => sum + c.departed, 0);
  const totalAll = companies.reduce((sum, c) => sum + c.total_passed, 0);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredCompanies.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    const exportData = filteredCompanies.map(company => ({
      "Mã công ty": company.code,
      "Tên công ty": company.name,
      "Tên tiếng Nhật": company.name_japanese || "",
      "Địa chỉ": company.work_address || company.address || "",
      "Ngày PV gần nhất": company.last_interview_date 
        ? format(new Date(company.last_interview_date), "dd/MM/yyyy", { locale: vi })
        : "",
      "Đang làm hồ sơ": company.doing_paperwork,
      "Đã xuất cảnh": company.departed,
      "Tổng đậu": company.total_passed,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tình trạng hồ sơ");
    
    const fileName = `tinh-trang-ho-so_${format(new Date(), "ddMMyyyy")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`Đã xuất ${filteredCompanies.length} công ty`);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Tình trạng hồ sơ</h1>
        <p className="text-sm text-muted-foreground">
          Danh sách công ty đã tuyển học viên và tình trạng hồ sơ
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng công ty</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">Đã tuyển học viên</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng học viên đậu</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAll}</div>
            <p className="text-xs text-muted-foreground">Đã đậu phỏng vấn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang làm hồ sơ</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalPaperwork}</div>
            <p className="text-xs text-muted-foreground">OTIT/Nyukan/COE/Visa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã xuất cảnh</CardTitle>
            <Plane className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalDeparted}</div>
            <p className="text-xs text-muted-foreground">Đang làm việc tại Nhật</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">Danh sách công ty</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo mã, tên công ty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Lọc theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="paperwork">Đang làm hồ sơ</SelectItem>
                  <SelectItem value="departed">Đã xuất cảnh</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "Không tìm thấy công ty phù hợp" 
                : "Chưa có công ty nào đã tuyển học viên"
              }
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Mã công ty</TableHead>
                    <TableHead>Tên công ty</TableHead>
                    <TableHead>Địa chỉ làm việc</TableHead>
                    <TableHead className="w-[120px]">Ngày PV gần nhất</TableHead>
                    <TableHead className="text-center w-[100px]">Đang làm HS</TableHead>
                    <TableHead className="text-center w-[100px]">Đã xuất cảnh</TableHead>
                    <TableHead className="text-center w-[80px]">Tổng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-mono font-medium">
                        {company.code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          {company.name_japanese && (
                            <p className="text-xs text-muted-foreground">{company.name_japanese}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {company.work_address || company.address || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {company.last_interview_date 
                          ? format(new Date(company.last_interview_date), "dd/MM/yyyy", { locale: vi })
                          : "—"
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        {company.doing_paperwork > 0 ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {company.doing_paperwork}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {company.departed > 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {company.departed}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {company.total_passed}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}