import { useState } from "react";
import { useOrderTrainees, OrderTrainee } from "@/hooks/useOrderTrainees";
import { Order } from "@/hooks/useOrders";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { RefreshCw, Users, Trash2 } from "lucide-react";

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
  const queryClient = useQueryClient();
  const { isAdmin, isSeniorStaff } = useUserRole();
  const canDelete = isAdmin || isSeniorStaff;
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [traineeToRemove, setTraineeToRemove] = useState<OrderTrainee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: trainees, isLoading, refetch } = useOrderTrainees(
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

  const handleRemoveClick = (trainee: OrderTrainee) => {
    setTraineeToRemove(trainee);
    setDeleteDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!traineeToRemove || !order) return;

    setIsDeleting(true);
    try {
      // Xóa record interview_history của học viên này với đơn tuyển
      const { error } = await supabase
        .from("interview_history")
        .delete()
        .eq("trainee_id", traineeToRemove.id)
        .eq("company_id", order.company_id)
        .eq("interview_date", order.expected_interview_date);

      if (error) throw error;

      toast.success(`Đã xóa ${traineeToRemove.full_name} khỏi đơn tuyển`);
      
      // Refresh data
      refetch();
      queryClient.invalidateQueries({ queryKey: ["order-trainee-counts"] });
    } catch (error: any) {
      toast.error("Lỗi khi xóa: " + error.message);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTraineeToRemove(null);
    }
  };

  return (
    <>
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
                    {canDelete && <TableHead className="w-12"></TableHead>}
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
                      {canDelete && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveClick(trainee)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa ứng viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa <strong>{traineeToRemove?.full_name}</strong> khỏi đơn tuyển <strong>{order?.code}</strong>?
              <br />
              <span className="text-amber-600">Lịch sử phỏng vấn của học viên với đơn này sẽ bị xóa.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
