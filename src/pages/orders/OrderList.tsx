import { useState } from "react";
import { useOrders, Order } from "@/hooks/useOrders";
import { useOrderTraineeCounts } from "@/hooks/useOrderTrainees";
import { OrderForm } from "./OrderForm";
import { OrderTraineesModal } from "./OrderTraineesModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, RefreshCw, Search, MapPin, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useCanAction } from "@/hooks/useMenuPermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

export default function OrderList() {
  const { data: orders, isLoading, refetch } = useOrders();
  const { data: traineeCounts } = useOrderTraineeCounts();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [traineesModalOpen, setTraineesModalOpen] = useState(false);
  const [orderForTrainees, setOrderForTrainees] = useState<Order | null>(null);

  const { hasPermission: canDelete } = useCanAction("orders", "delete");

  const filteredOrders = orders?.filter(
    (order) =>
      order.code.toLowerCase().includes(search.toLowerCase()) ||
      order.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.job_category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedOrder(null);
    setFormOpen(true);
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setFormOpen(true);
  };

  const handleViewTrainees = (order: Order) => {
    setOrderForTrainees(order);
    setTraineesModalOpen(true);
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderToDelete.id);

      if (error) throw error;

      toast.success("Đã xóa đơn hàng thành công!");
      refetch();
    } catch (error: any) {
      toast.error("Lỗi khi xóa đơn hàng: " + error.message);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Nghiệp vụ Kinh doanh</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-primary uppercase">Đơn hàng đang tuyển dụng</span>
        </div>
        <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          THÊM ĐƠN HÀNG
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên công ty, ngành nghề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-border"
          />
        </div>
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          DANH SÁCH ĐƠN HÀNG SẮP PHỎNG VẤN
        </Button>
      </div>

      {/* Orders Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredOrders?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-4">Chưa có đơn hàng nào</p>
            <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              THÊM ĐƠN HÀNG
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-14 font-semibold text-foreground">STT</TableHead>
                <TableHead className="font-semibold text-foreground">TÊN CÔNG TY</TableHead>
                <TableHead className="font-semibold text-foreground">NGÀNH NGHỀ</TableHead>
                <TableHead className="font-semibold text-foreground">ĐỊA CHỈ CÔNG TY</TableHead>
                <TableHead className="font-semibold text-foreground text-center">SỐ LƯỢNG TUYỂN</TableHead>
                <TableHead className="font-semibold text-foreground text-center">ỨNG VIÊN THAM GIA</TableHead>
                <TableHead className="font-semibold text-foreground">NGÀY PHỎNG VẤN</TableHead>
                <TableHead className="font-semibold text-foreground text-center">THAO TÁC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.map((order, index) => {
                const traineeCount = traineeCounts?.[order.id] || 0;
                const quantity = order.quantity || 0;
                
                return (
                  <TableRow key={order.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-center">{index + 1}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-blue-600 uppercase">
                        {order.company?.name || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{order.job_category?.name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>{order.work_address || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {quantity}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleViewTrainees(order)}
                        className="text-green-600 font-semibold hover:underline cursor-pointer"
                      >
                        {traineeCount}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {order.expected_interview_date
                            ? format(new Date(order.expected_interview_date), "dd/MM/yyyy")
                            : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-xs font-semibold border-orange-400 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                          onClick={() => handleEdit(order)}
                        >
                          CHI TIẾT
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleViewTrainees(order)}
                        >
                          ỨNG VIÊN
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <OrderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        order={selectedOrder}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đơn hàng <strong>{orderToDelete?.code}</strong>? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trainees Modal */}
      <OrderTraineesModal
        open={traineesModalOpen}
        onOpenChange={setTraineesModalOpen}
        order={orderForTrainees}
      />
    </div>
  );
}
