import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Search, Building2, FileText, Users, FileCheck, FileClock, FileX, GraduationCap, Wrench, UserCheck } from "lucide-react";

interface CompanyBatch {
  company_id: string;
  code: string;
  name: string;
  name_japanese: string | null;
  address: string | null;
  work_address: string | null;
  interview_pass_date: string;
  docs_not_started: number;
  docs_in_progress: number;
  docs_completed: number;
  total_passed: number;
}

interface TraineeTypeCount {
  trainee_type: string | null;
  count: number;
}

interface TraineeBasic {
  id: string;
  trainee_code: string;
  full_name: string;
  gender: string | null;
  birth_date: string | null;
  progression_stage: string | null;
  receiving_company: { name: string } | null;
}

const TRAINEE_TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  'TTS': { label: 'Thực tập sinh', icon: Users },
  'TTS3': { label: 'TTS số 3', icon: Users },
  'Du học sinh': { label: 'Du học sinh', icon: GraduationCap },
  'Kỹ năng đặc định': { label: 'Kỹ năng đặc định', icon: Wrench },
  'Kỹ sư': { label: 'Kỹ sư', icon: UserCheck },
};

export default function LegalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);

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

  // Query trainees by selected type
  const { data: traineesByType = [], isLoading: isLoadingTrainees } = useQuery({
    queryKey: ["legal-trainees-by-type", selectedType],
    queryFn: async () => {
      if (!selectedType) return [];
      
      // Use type assertion since we're using custom trainee_type values
      const { data, error } = await supabase
        .from("trainees")
        .select(`
          id,
          trainee_code,
          full_name,
          gender,
          birth_date,
          progression_stage,
          receiving_company:companies!fk_trainees_company(name)
        `)
        .eq("trainee_type", selectedType as any)
        .not("progression_stage", "is", null)
        .neq("progression_stage", "Chưa đậu")
        .not("receiving_company_id", "is", null)
        .order("full_name");

      if (error) throw error;
      return (data || []) as TraineeBasic[];
    },
    enabled: !!selectedType && showTypeModal,
  });

  // Build type counts map
  const typeCountsMap = typeStats.reduce((acc, item) => {
    if (item.trainee_type) {
      acc[item.trainee_type] = item.count;
    }
    return acc;
  }, {} as Record<string, number>);

  // Filter batches by search
  const filteredBatches = companyBatches.filter(batch => {
    return (
      batch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.name_japanese?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
  });

  const handleTypeClick = (type: string) => {
    setSelectedType(type);
    setShowTypeModal(true);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Tình trạng hồ sơ</h1>
        <p className="text-sm text-muted-foreground">
          Danh sách đợt tuyển và tình trạng hồ sơ
        </p>
      </header>

      {/* Summary Stats Cards */}
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

      {/* Trainee Type Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(TRAINEE_TYPE_CONFIG).map(([type, config]) => {
          const count = typeCountsMap[type] || 0;
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
                <div className="text-2xl font-bold text-primary">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Company Batches Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">Danh sách đợt tuyển</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã, tên công ty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
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
              {searchTerm 
                ? "Không tìm thấy đợt tuyển phù hợp" 
                : "Chưa có đợt tuyển nào"
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
                    <TableHead className="w-[120px]">Ngày đậu PV</TableHead>
                    <TableHead className="text-center w-[80px]">Số HV</TableHead>
                    <TableHead className="text-center w-[100px]">Chưa làm</TableHead>
                    <TableHead className="text-center w-[100px]">Đang làm</TableHead>
                    <TableHead className="text-center w-[100px]">Đã xong</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch, idx) => (
                    <TableRow key={`${batch.company_id}-${batch.interview_pass_date}-${idx}`}>
                      <TableCell className="font-mono font-medium">
                        {batch.code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{batch.name}</p>
                          {batch.name_japanese && (
                            <p className="text-xs text-muted-foreground">{batch.name_japanese}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {batch.work_address || batch.address || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(batch.interview_pass_date), "dd/MM/yyyy", { locale: vi })}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {batch.total_passed}
                      </TableCell>
                      <TableCell className="text-center">
                        {batch.docs_not_started > 0 ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">
                            {batch.docs_not_started}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {batch.docs_in_progress > 0 ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {batch.docs_in_progress}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {batch.docs_completed > 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {batch.docs_completed}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trainee Type Modal */}
      <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedType ? TRAINEE_TYPE_CONFIG[selectedType]?.label : ''} - Danh sách học viên đậu
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingTrainees ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : traineesByType.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Không có học viên</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Mã HV</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead className="w-[80px]">Giới tính</TableHead>
                  <TableHead className="w-[100px]">Năm sinh</TableHead>
                  <TableHead>Công ty</TableHead>
                  <TableHead className="w-[120px]">Tình trạng</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
