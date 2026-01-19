import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface CompanyTrainee {
  id: string;
  trainee_code: string;
  full_name: string;
  birth_date: string | null;
  birthplace: string | null;
  progression_stage: string | null;
  departure_date: string | null;
  contract_term: number | null;
  trainee_type: string | null;
}

interface CompanyTraineesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
}

// Helper to extract province from birthplace
const getProvince = (birthplace: string | null): string => {
  if (!birthplace) return "-";
  const parts = birthplace.split(",");
  return parts[parts.length - 1]?.trim() || birthplace;
};

// Map progression_stage to display status
const getStatusDisplay = (stage: string | null): { label: string; color: string } => {
  const stageMap: Record<string, { label: string; color: string }> = {
    "Đậu phỏng vấn": { label: "Đậu PV", color: "bg-green-100 text-green-700 border-green-200" },
    "Nộp hồ sơ": { label: "Nộp hồ sơ", color: "bg-blue-100 text-blue-700 border-blue-200" },
    "OTIT": { label: "OTIT", color: "bg-purple-100 text-purple-700 border-purple-200" },
    "Nyukan": { label: "Nyukan", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    "COE": { label: "COE", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
    "Xuất cảnh": { label: "Xuất cảnh", color: "bg-primary/10 text-primary border-primary/20" },
    "Bỏ trốn": { label: "Bỏ trốn", color: "bg-red-100 text-red-700 border-red-200" },
    "Về trước HĐ": { label: "Về trước HĐ", color: "bg-orange-100 text-orange-700 border-orange-200" },
    "Hoàn thành HĐ": { label: "Hoàn thành HĐ", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  };
  return stageMap[stage || ""] || { label: stage || "-", color: "bg-gray-100 text-gray-700 border-gray-200" };
};

// Map trainee_type to display
const getTypeDisplay = (type: string | null): string => {
  const typeMap: Record<string, string> = {
    "tts": "TTS",
    "tts3": "TTS3",
    "student": "Du học sinh",
    "knd": "KNĐ",
    "engineer": "Kỹ sư",
  };
  return typeMap[type || ""] || type || "-";
};

export default function CompanyTraineesModal({
  open,
  onOpenChange,
  companyId,
  companyName,
}: CompanyTraineesModalProps) {
  const navigate = useNavigate();
  const [trainees, setTrainees] = useState<CompanyTrainee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && companyId) {
      fetchTrainees();
    }
  }, [open, companyId]);

  const fetchTrainees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trainees")
        .select("id, trainee_code, full_name, birth_date, birthplace, progression_stage, departure_date, contract_term, trainee_type")
        .eq("receiving_company_id", companyId)
        .order("trainee_code", { ascending: true });

      if (error) throw error;
      setTrainees(data || []);
    } catch (error) {
      console.error("Error fetching trainees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTrainee = (traineeId: string) => {
    navigate(`/trainees/${traineeId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-primary">
            Danh sách học viên - {companyName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : trainees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Chưa có học viên nào tham gia công ty này
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Mã HV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Ngày sinh</TableHead>
                  <TableHead>Quê quán</TableHead>
                  <TableHead>Tình trạng</TableHead>
                  <TableHead>Ngày xuất cảnh</TableHead>
                  <TableHead>Thời hạn HĐ</TableHead>
                  <TableHead>Diện</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainees.map((trainee) => {
                  const status = getStatusDisplay(trainee.progression_stage);
                  return (
                    <TableRow key={trainee.id}>
                      <TableCell className="font-medium text-primary">
                        {trainee.trainee_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {trainee.full_name}
                      </TableCell>
                      <TableCell>
                        {trainee.birth_date
                          ? format(new Date(trainee.birth_date), "dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>{getProvince(trainee.birthplace)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {trainee.departure_date
                          ? format(new Date(trainee.departure_date), "dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {trainee.contract_term ? `${trainee.contract_term} năm` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {getTypeDisplay(trainee.trainee_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewTrainee(trainee.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="text-sm text-muted-foreground pt-2 border-t">
          Tổng: {trainees.length} học viên
        </div>
      </DialogContent>
    </Dialog>
  );
}
