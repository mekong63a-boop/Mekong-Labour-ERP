import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateOrder,
  useUpdateOrder,
  useCompanies,
  useUnions,
  useJobCategories,
  OrderFormData,
  Order,
} from "@/hooks/useOrders";
import { Upload } from "lucide-react";

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
}

const STATUS_OPTIONS = [
  "Đang tuyển",
  "Đã đủ form",
  "Đã phỏng vấn",
  "Hoàn thành",
  "Hủy",
];

const GENDER_OPTIONS = ["Cả hai", "Nam", "Nữ"];

const CONTRACT_TERMS = [
  { value: "1", label: "1 năm" },
  { value: "2", label: "2 năm" },
  { value: "3", label: "3 năm" },
  { value: "5", label: "5 năm" },
];

export function OrderForm({ open, onOpenChange, order }: OrderFormProps) {
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const { data: companies } = useCompanies();
  const { data: unions } = useUnions();
  const { data: jobCategories } = useJobCategories();

  const [formData, setFormData] = useState<OrderFormData>({
    code: "",
    company_id: null,
    union_id: null,
    job_category_id: null,
    work_address: "",
    quantity: 1,
    contract_term: 3,
    gender_requirement: "Cả hai",
    expected_interview_date: null,
    status: "Đang tuyển",
    image_url: null,
    notes: "",
  });

  useEffect(() => {
    if (order) {
      setFormData({
        code: order.code,
        company_id: order.company_id,
        union_id: order.union_id,
        job_category_id: order.job_category_id,
        work_address: order.work_address || "",
        quantity: order.quantity || 1,
        contract_term: order.contract_term || 3,
        gender_requirement: order.gender_requirement || "Cả hai",
        expected_interview_date: order.expected_interview_date,
        status: order.status || "Đang tuyển",
        image_url: order.image_url,
        notes: order.notes || "",
      });
    } else {
      // Generate order code
      const now = new Date();
      const code = `DH${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setFormData((prev) => ({ ...prev, code }));
    }
  }, [order, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code) {
      return;
    }

    const submitData = {
      ...formData,
      quantity: formData.quantity || 1,
      contract_term: formData.contract_term || 3,
    };

    if (order) {
      await updateOrder.mutateAsync({ id: order.id, data: submitData });
    } else {
      await createOrder.mutateAsync(submitData);
    }

    onOpenChange(false);
  };

  const isSubmitting = createOrder.isPending || updateOrder.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-xl font-bold">
            {order ? "Chỉnh sửa đơn hàng" : "Thêm đơn hàng mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Code & Company */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-primary font-medium">Mã đơn hàng</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="DH2601-KA31"
                className="border-primary/30 focus:border-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-medium">Công ty tiếp nhận</Label>
              <Select
                value={formData.company_id || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    company_id: value || null,
                  }))
                }
              >
                <SelectTrigger className="border-primary/30">
                  <SelectValue placeholder="Chọn công ty" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Job Category & Work Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-primary font-medium">Ngành nghề</Label>
              <Select
                value={formData.job_category_id || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    job_category_id: value || null,
                  }))
                }
              >
                <SelectTrigger className="border-primary/30">
                  <SelectValue placeholder="Chọn ngành nghề" />
                </SelectTrigger>
                <SelectContent>
                  {jobCategories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-medium">Địa chỉ làm việc</Label>
              <Input
                value={formData.work_address || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    work_address: e.target.value,
                  }))
                }
                placeholder="Tỉnh/Thành phố"
                className="border-primary/30"
              />
            </div>
          </div>

          {/* Row 3: Quantity & Contract Term */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-primary font-medium">Số lượng tuyển</Label>
              <Input
                type="number"
                min={1}
                value={formData.quantity || 1}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 1,
                  }))
                }
                className="border-primary/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-medium">Thời hạn hợp đồng</Label>
              <Select
                value={String(formData.contract_term || 3)}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    contract_term: parseInt(value),
                  }))
                }
              >
                <SelectTrigger className="border-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_TERMS.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Gender & Interview Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-primary font-medium">Giới tính</Label>
              <Select
                value={formData.gender_requirement || "Cả hai"}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    gender_requirement: value,
                  }))
                }
              >
                <SelectTrigger className="border-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-medium">
                Ngày phỏng vấn dự kiến
              </Label>
              <Input
                type="date"
                value={formData.expected_interview_date || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expected_interview_date: e.target.value || null,
                  }))
                }
                className="border-primary/30"
              />
            </div>
          </div>

          {/* Row 5: Status */}
          <div className="space-y-2">
            <Label className="text-primary font-medium">Tình trạng</Label>
            <Select
              value={formData.status || "Đang tuyển"}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="border-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 6: Image Upload */}
          <div className="space-y-2">
            <Label className="text-primary font-medium">Hình ảnh đơn hàng</Label>
            <Button
              type="button"
              variant="outline"
              className="border-primary/30"
            >
              <Upload className="h-4 w-4 mr-2" />
              Tải ảnh lên
            </Button>
          </div>

          {/* Row 7: Notes */}
          <div className="space-y-2">
            <Label className="text-primary font-medium">Ghi chú</Label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Nhập ghi chú..."
              className="border-primary/30 min-h-[100px] bg-primary/5"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {order ? "Cập nhật" : "Tạo đơn hàng"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
