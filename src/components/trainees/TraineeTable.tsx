import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trainee } from "@/types/trainee";
import { format } from "date-fns";

interface TraineeTableProps {
  trainees: Trainee[];
}

export function TraineeTable({ trainees }: TraineeTableProps) {
  const navigate = useNavigate();

  if (trainees.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Không có thực tập sinh nào
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
    } catch {
      return "—";
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã TTS</TableHead>
            <TableHead>Họ tên</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Giai đoạn</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Cập nhật</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainees.map((trainee) => (
            <TableRow
              key={trainee.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/trainees/${trainee.id}`)}
            >
              <TableCell className="font-mono">{trainee.trainee_code}</TableCell>
              <TableCell className="font-medium">{trainee.full_name}</TableCell>
              <TableCell>
                {trainee.simple_status && (
                  <Badge variant="outline">{trainee.simple_status}</Badge>
                )}
              </TableCell>
              <TableCell>
                {trainee.progression_stage && (
                  <Badge variant="secondary">{trainee.progression_stage}</Badge>
                )}
              </TableCell>
              <TableCell>{trainee.trainee_type || "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(trainee.updated_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
