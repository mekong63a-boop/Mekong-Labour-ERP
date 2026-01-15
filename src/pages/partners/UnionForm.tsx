import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUnions, useCreateUnion, useUpdateUnion } from "@/hooks/usePartners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, FileText } from "lucide-react";

const STATUS_OPTIONS = ["Đang hợp tác", "Ngừng hợp tác"];

export default function UnionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { data: unions } = useUnions();
  const createUnion = useCreateUnion();
  const updateUnion = useUpdateUnion();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    name_japanese: "",
    country: "Nhật Bản",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    status: "Đang hợp tác",
    notes: "",
  });

  useEffect(() => {
    if (isEdit && unions) {
      const union = unions.find((u) => u.id === id);
      if (union) {
        setFormData({
          code: union.code,
          name: union.name,
          name_japanese: union.name_japanese || "",
          country: union.country || "Nhật Bản",
          contact_person: union.contact_person || "",
          phone: union.phone || "",
          email: union.email || "",
          address: union.address || "",
          status: union.status || "Đang hợp tác",
          notes: union.notes || "",
        });
      }
    }
  }, [isEdit, id, unions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;

    if (isEdit && id) {
      await updateUnion.mutateAsync({ id, data: formData });
    } else {
      await createUnion.mutateAsync(formData);
    }
    navigate("/partners");
  };

  const isSubmitting = createUnion.isPending || updateUnion.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/partners")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-primary">
            {isEdit ? "Chỉnh sửa nghiệp đoàn" : "Thêm nghiệp đoàn mới"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/partners")}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary/80 hover:bg-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? "Cập nhật" : "Thêm mới"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Thông tin nghiệp đoàn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-primary">
                  Mã nghiệp đoàn <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="VD: ND-001"
                  className="bg-amber-50/50 border-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-primary">
                  Tên nghiệp đoàn <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="VD: Nghiệp đoàn ABC"
                  className="bg-amber-50/50 border-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-primary">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-amber-50/50 border-primary/20">
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
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-primary">Quốc gia</Label>
                <Input
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, country: e.target.value }))
                  }
                  placeholder="Nhật Bản"
                  className="bg-amber-50/50 border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-primary">Người liên hệ</Label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contact_person: e.target.value }))
                  }
                  placeholder="Họ tên"
                  className="bg-amber-50/50 border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-primary">Số điện thoại</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+81-3-1234-5678"
                  className="bg-amber-50/50 border-primary/20"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-primary">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@example.jp"
                  className="bg-amber-50/50 border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-primary">Địa chỉ</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Địa chỉ chi tiết..."
                  className="bg-amber-50/50 border-primary/20 min-h-[60px]"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-primary">Ghi chú</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Ghi chú thêm..."
                className="bg-amber-50/50 border-primary/20 min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
