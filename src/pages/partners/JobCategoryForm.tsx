import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useJobCategories, useCreateJobCategory, useUpdateJobCategory } from "@/hooks/usePartners";
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
import { ArrowLeft, Save, Briefcase } from "lucide-react";
import { useDuplicateCheck, getDuplicateErrorMessage } from "@/hooks/useDuplicateCheck";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_OPTIONS = [
  "Khác",
  "Xây dựng",
  "Thực phẩm",
  "Cơ khí",
  "Nông nghiệp",
  "Dệt may",
  "Điều dưỡng",
];

export default function JobCategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { toast } = useToast();

  const { data: jobCategories } = useJobCategories();
  const createJobCategory = useCreateJobCategory();
  const updateJobCategory = useUpdateJobCategory();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    name_japanese: "",
    category: "Khác",
    description: "",
    status: "Hoạt động",
  });

  // Real-time duplicate check for code
  const { isDuplicate: isCodeDuplicate, isChecking: isCheckingCode } = useDuplicateCheck(
    formData.code,
    {
      table: 'job_categories',
      field: 'code',
      currentId: id,
      enabled: formData.code.length >= 2,
    }
  );

  // Real-time duplicate check for name
  const { isDuplicate: isNameDuplicate, isChecking: isCheckingName } = useDuplicateCheck(
    formData.name,
    {
      table: 'job_categories',
      field: 'name',
      currentId: id,
      enabled: formData.name.length >= 2,
    }
  );

  // Real-time duplicate check for Japanese name
  const { isDuplicate: isNameJpDuplicate, isChecking: isCheckingNameJp } = useDuplicateCheck(
    formData.name_japanese,
    {
      table: 'job_categories',
      field: 'name_japanese',
      currentId: id,
      enabled: formData.name_japanese.length >= 2,
    }
  );

  useEffect(() => {
    if (isEdit && jobCategories) {
      const job = jobCategories.find((j) => j.id === id);
      if (job) {
        setFormData({
          code: job.code,
          name: job.name,
          name_japanese: job.name_japanese || "",
          category: job.category || "Khác",
          description: job.description || "",
          status: job.status || "Hoạt động",
        });
      }
    }
  }, [isEdit, id, jobCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;

    // Check for duplicates before submitting
    if (isCodeDuplicate) {
      toast({
        title: "Mã ngành nghề đã tồn tại",
        description: "Vui lòng nhập mã khác.",
        variant: "destructive",
      });
      return;
    }
    if (isNameDuplicate) {
      toast({
        title: "Tên ngành nghề đã tồn tại",
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
      await updateJobCategory.mutateAsync({ id, data: formData });
    } else {
      await createJobCategory.mutateAsync(formData);
    }
    navigate("/partners");
  };

  const isSubmitting = createJobCategory.isPending || updateJobCategory.isPending;
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
          <Briefcase className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-primary">
            {isEdit ? "Chỉnh sửa ngành nghề" : "Thêm ngành nghề mới"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/partners")}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || hasDuplicates}
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
            <CardTitle className="text-lg text-foreground">Thông tin ngành nghề</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-primary">
                  Mã ngành nghề <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="VD: NN-011"
                  className={`bg-amber-50/50 border-primary/20 ${isCodeDuplicate ? 'border-destructive' : ''}`}
                  required
                />
                {isCheckingCode && (
                  <span className="text-xs text-muted-foreground">Đang kiểm tra...</span>
                )}
                {isCodeDuplicate && !isCheckingCode && (
                  <span className="text-xs text-destructive">{getDuplicateErrorMessage('job_categories', 'code')}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-primary">
                  Tên ngành nghề <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="VD: Cơ khí"
                  className={`bg-amber-50/50 border-primary/20 ${isNameDuplicate ? 'border-destructive' : ''}`}
                  required
                />
                {isCheckingName && (
                  <span className="text-xs text-muted-foreground">Đang kiểm tra...</span>
                )}
                {isNameDuplicate && !isCheckingName && (
                  <span className="text-xs text-destructive">{getDuplicateErrorMessage('job_categories', 'name')}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-primary">Phân loại</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className="bg-amber-50/50 border-primary/20">
                    <SelectValue placeholder="Chọn phân loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-primary">Tên tiếng Nhật</Label>
                <Input
                  value={formData.name_japanese}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name_japanese: e.target.value }))
                  }
                  placeholder="VD: 機械"
                  className="bg-amber-50/50 border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-primary">Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Mô tả chi tiết..."
                  className="bg-amber-50/50 border-primary/20 min-h-[60px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}