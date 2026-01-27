import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCompanies, useCreateCompany, useUpdateCompany, Company } from "@/hooks/usePartners";
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
import { ArrowLeft, Save, FileText, Upload } from "lucide-react";
import { useDuplicateCheck, getDuplicateErrorMessage } from "@/hooks/useDuplicateCheck";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = ["Đang hợp tác", "Ngừng hợp tác"];

export default function CompanyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { toast } = useToast();

  const { data: companies } = useCompanies();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    name_japanese: "",
    address: "",
    work_address: "",
    representative: "",
    position: "",
    email: "",
    phone: "",
    country: "Nhật Bản",
    status: "Đang hợp tác",
    notes: "",
  });

  // Real-time duplicate check for code
  const { isDuplicate: isCodeDuplicate, isChecking: isCheckingCode } = useDuplicateCheck(
    formData.code,
    {
      table: 'companies',
      field: 'code',
      currentId: id,
      enabled: formData.code.length >= 2,
    }
  );

  // Real-time duplicate check for name
  const { isDuplicate: isNameDuplicate, isChecking: isCheckingName } = useDuplicateCheck(
    formData.name,
    {
      table: 'companies',
      field: 'name',
      currentId: id,
      enabled: formData.name.length >= 2,
    }
  );

  // Real-time duplicate check for Japanese name
  const { isDuplicate: isNameJpDuplicate, isChecking: isCheckingNameJp } = useDuplicateCheck(
    formData.name_japanese,
    {
      table: 'companies',
      field: 'name_japanese',
      currentId: id,
      enabled: formData.name_japanese.length >= 2,
    }
  );

  useEffect(() => {
    if (isEdit && companies) {
      const company = companies.find((c) => c.id === id);
      if (company) {
        setFormData({
          code: company.code,
          name: company.name,
          name_japanese: company.name_japanese || "",
          address: company.address || "",
          work_address: company.work_address || "",
          representative: company.representative || "",
          position: company.position || "",
          email: company.email || "",
          phone: company.phone || "",
          country: company.country || "Nhật Bản",
          status: company.status || "Đang hợp tác",
          notes: company.notes || "",
        });
      }
    }
  }, [isEdit, id, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;

    // Check for duplicates before submitting
    if (isCodeDuplicate) {
      toast({
        title: "Mã công ty đã tồn tại",
        description: "Vui lòng nhập mã khác.",
        variant: "destructive",
      });
      return;
    }
    if (isNameDuplicate) {
      toast({
        title: "Tên công ty đã tồn tại",
        description: "Vui lòng nhập tên khác.",
        variant: "destructive",
      });
      return;
    }
    if (isNameJpDuplicate) {
      toast({
        title: "Tên tiếng Nhật đã tồn tại",
        description: "Vui lòng nhập tên khác.",
        variant: "destructive",
      });
      return;
    }

    if (isEdit && id) {
      await updateCompany.mutateAsync({ id, data: formData });
    } else {
      await createCompany.mutateAsync(formData);
    }
    navigate("/partners");
  };

  const isSubmitting = createCompany.isPending || updateCompany.isPending;
  const hasDuplicates = isCodeDuplicate || isNameDuplicate || isNameJpDuplicate;

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
          <h1 className="text-xl font-bold text-primary">
            {isEdit ? "Chỉnh sửa Công ty" : "Thêm Công ty đối tác mới"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/partners")}>
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || hasDuplicates}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            Lưu lại
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-primary">
                    Mã đối tác <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder="VD: CT-001"
                    className={`bg-amber-50/50 border-primary/20 ${isCodeDuplicate ? 'border-destructive' : ''}`}
                    required
                  />
                  {isCheckingCode && (
                    <span className="text-xs text-muted-foreground">Đang kiểm tra...</span>
                  )}
                  {isCodeDuplicate && !isCheckingCode && (
                    <span className="text-xs text-destructive">{getDuplicateErrorMessage('companies', 'code')}</span>
                  )}
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

              <div className="space-y-2">
                <Label className="text-primary">
                  Tên đối tác <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Tên công ty / Nghiệp đoàn"
                  className={`bg-amber-50/50 border-primary/20 ${isNameDuplicate ? 'border-destructive' : ''}`}
                  required
                />
                {isCheckingName && (
                  <span className="text-xs text-muted-foreground">Đang kiểm tra...</span>
                )}
                {isNameDuplicate && !isCheckingName && (
                  <span className="text-xs text-destructive">{getDuplicateErrorMessage('companies', 'name')}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-primary">Tên tiếng Nhật</Label>
                  <Input
                    value={formData.name_japanese}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name_japanese: e.target.value }))
                    }
                    placeholder="会社名"
                    className={`bg-amber-50/50 border-primary/20 ${isNameJpDuplicate ? 'border-destructive' : ''}`}
                  />
                  {isCheckingNameJp && (
                    <span className="text-xs text-muted-foreground">Đang kiểm tra...</span>
                  )}
                  {isNameJpDuplicate && !isCheckingNameJp && (
                    <span className="text-xs text-destructive">{getDuplicateErrorMessage('companies', 'name_japanese')}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-primary">Địa chỉ làm việc</Label>
                <Textarea
                  value={formData.work_address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, work_address: e.target.value }))
                  }
                  placeholder="Địa chỉ chi tiết..."
                  className="bg-amber-50/50 border-primary/20 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-primary">Người đại diện</Label>
                  <Input
                    value={formData.representative}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, representative: e.target.value }))
                    }
                    placeholder="Họ tên"
                    className="bg-amber-50/50 border-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-primary">Chức vụ</Label>
                  <Input
                    value={formData.position}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, position: e.target.value }))
                    }
                    placeholder="VD: Giám đốc"
                    className="bg-amber-50/50 border-primary/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-primary">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="email@company.com"
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
                    placeholder="+81-XXX-XXXX"
                    className="bg-amber-50/50 border-primary/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Ghi chú</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Ghi chú về các đơn hàng thường tuyển, yêu cầu đặc biệt..."
                className="bg-amber-50/50 border-primary/20 min-h-[100px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Logo Upload */}
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Logo công ty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-primary/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nhấp để tải logo
                </p>
                <p className="text-xs text-muted-foreground mt-1">(Tối đa 2MB)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}