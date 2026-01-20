import { useOrderTrainees, OrderTrainee } from "@/hooks/useOrderTrainees";
import { Order } from "@/hooks/useOrders";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { RefreshCw, Users } from "lucide-react";

interface OrderTraineesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function OrderTraineesModal({
  open,
  onOpenChange,
  order,
}: OrderTraineesModalProps) {
  const { data: trainees, isLoading } = useOrderTrainees(
    order?.id || null,
    order
      ? {
          company_id: order.company_id,
          union_id: order.union_id,
          job_category_id: order.job_category_id,
          expected_interview_date: order.expected_interview_date,
        }
      : undefined
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return "-";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>
              Danh sách ứng viên - Đơn tuyển{" "}
              <span className="text-primary">{order?.code}</span>
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Order Info Summary */}
        {order && (
          <div className="flex flex-wrap gap-2 pb-4 border-b">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Công ty: {order.company?.name || "-"}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Ngành nghề: {order.job_category?.name || "-"}
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Ngày PV: {formatDate(order.expected_interview_date)}
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              Số lượng cần: {order.quantity || 0}
            </Badge>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !trainees || trainees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Chưa có ứng viên
            </h3>
            <p className="text-muted-foreground">
              Chưa có học viên nào tham gia đơn tuyển này
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Tổng số:{" "}
                <span className="font-semibold text-primary">
                  {trainees.length}/{order?.quantity || 0}
                </span>{" "}
                ứng viên
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead>Mã HV</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Ngày sinh</TableHead>
                  <TableHead>Quê quán</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead className="text-center">Số lần PV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainees.map((trainee, index) => (
                  <TableRow key={trainee.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {trainee.trainee_code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {trainee.full_name}
                    </TableCell>
                    <TableCell>{formatDate(trainee.birth_date)}</TableCell>
                    <TableCell>{trainee.birthplace || "-"}</TableCell>
                    <TableCell>{trainee.phone || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          trainee.interview_count > 1
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }
                      >
                        {trainee.interview_count}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
