import { useState } from "react";
import { useOrders, useOrderStats, Order } from "@/hooks/useOrders";
import { useOrderTraineeCounts } from "@/hooks/useOrderTrainees";
import { OrderForm } from "./OrderForm";
import { OrderTraineesModal } from "./OrderTraineesModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, FileText, Eye, Edit, Trash2, Users } from "lucide-react";
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
  const stats = useOrderStats();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [traineesModalOpen, setTraineesModalOpen] = useState(false);
  const [orderForTrainees, setOrderForTrainees] = useState<Order | null>(null);

  // Kiểm tra quyền xóa
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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Đang tuyển":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Đã đủ form":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Đã phỏng vấn":
        return "bg-green-100 text-green-800 border-green-200";
      case "Hoàn thành":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Hủy":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quản lý Đơn hàng</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý các đơn hàng tuyển dụng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Thêm đơn hàng
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-sm text-amber-600">Đang tuyển</p>
            <p className="text-2xl font-bold text-amber-600">{stats.recruiting}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600">Đã đủ form</p>
            <p className="text-2xl font-bold text-blue-600">{stats.formComplete}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <p className="text-sm text-orange-600">Đã phỏng vấn</p>
            <p className="text-2xl font-bold text-orange-600">{stats.interviewed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary">
                Danh sách đơn hàng
              </h2>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-primary/20 bg-primary/5"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredOrders?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Chưa có đơn hàng
              </h3>
              <p className="text-muted-foreground mb-4">
                Bắt đầu bằng việc thêm đơn hàng mới
              </p>
              <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Thêm đơn hàng
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn hàng</TableHead>
                  <TableHead>Công ty</TableHead>
                  <TableHead>Ngành nghề</TableHead>
                  <TableHead>Ứng viên</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Ngày PV</TableHead>
                  <TableHead>Tình trạng</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.map((order) => {
                  const traineeCount = traineeCounts?.[order.id] || 0;
                  const quantity = order.quantity || 0;
                  
                  return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-primary">
                      {order.code}
                    </TableCell>
                    <TableCell>{order.company?.name || "-"}</TableCell>
                    <TableCell>{order.job_category?.name || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 gap-1.5 hover:bg-primary/10"
                        onClick={() => handleViewTrainees(order)}
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span className={
                          traineeCount >= quantity && quantity > 0
                            ? "text-green-600 font-semibold"
                            : traineeCount > 0
                            ? "text-amber-600 font-semibold"
                            : "text-muted-foreground"
                        }>
                          {traineeCount}/{quantity}
                        </span>
                      </Button>
                    </TableCell>
                    <TableCell>{order.work_address || "-"}</TableCell>
                    <TableCell>
                      {order.expected_interview_date
                        ? format(new Date(order.expected_interview_date), "dd/MM/yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(order.status)}
                      >
                        {order.status || "Đang tuyển"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(order)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
