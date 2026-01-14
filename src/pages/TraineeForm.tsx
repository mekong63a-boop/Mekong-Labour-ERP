import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { PhotoUpload } from "@/components/trainees/PhotoUpload";
import { CCCDScanner } from "@/components/trainees/CCCDScanner";
import { useTrainee, useUpdateTrainee } from "@/hooks/useTrainees";

// Options
const TRAINEE_TYPES = ["Thực tập sinh", "Kỹ năng đặc định", "Kỹ sư", "Du học sinh", "Thực tập sinh số 3"];
const GENDERS = ["Nam", "Nữ"];
const MARITAL_STATUSES = ["Độc thân", "Đã kết hôn", "Ly hôn", "Góa"];
const SIMPLE_STATUSES = ["Đăng ký mới", "Đang học", "Bảo lưu", "Dừng chương trình", "Không học", "Hủy", "Đang ở Nhật", "Rời công ty"];
const EDUCATION_LEVELS = ["THPT", "Trung cấp", "Cao đẳng", "Đại học", "Sau đại học", "Khác"];
const ETHNICITIES = ["Kinh", "Tày", "Thái", "Mường", "Khmer", "Nùng", "H'Mông", "Khác"];
const SOURCES = ["Facebook", "Zalo", "Giới thiệu", "Website", "Hội chợ việc làm", "Trường học", "Khác"];
const BLOOD_GROUPS = ["A", "B", "AB", "O"];
const DOMINANT_HANDS = ["Tay phải", "Tay trái", "Cả hai"];
const YES_NO = ["Có", "Không"];
const SMOKING_OPTIONS = ["Không", "Thỉnh thoảng", "Thường xuyên"];
const DRINKING_OPTIONS = ["Không", "Thỉnh thoảng", "Thường xuyên"];
const PROVINCES = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Khác"];

interface FormData {
  trainee_code: string;
  full_name: string;
  furigana: string;
  trainee_type: string;
  birth_date: string;
  birthplace: string;
  gender: string;
  marital_status: string;
  cccd_number: string;
  cccd_date: string;
  cccd_place: string;
  passport_number: string;
  passport_date: string;
  ethnicity: string;
  phone: string;
  source: string;
  education_level: string;
  temp_address: string;
  email: string;
  permanent_address: string;
  facebook: string;
  parent_phone_1: string;
  parent_phone_2: string;
  simple_status: string;
  current_situation: string;
  registration_date: string;
  height: string;
  vision_left: string;
  vision_right: string;
  dominant_hand: string;
  hobbies: string;
  weight: string;
  smoking: string;
  tattoo: string;
  drinking: string;
  blood_group: string;
  health_status: string;
  notes: string;
  photo_url: string;
}

interface TraineeFormContentProps {
  isEditMode: boolean;
  traineeId?: string;
}

export default function TraineeForm() {
  const { id } = useParams();
  const isEditMode = !!id;

  return <TraineeFormContent isEditMode={isEditMode} traineeId={id} />;
}

function TraineeFormContent({ isEditMode, traineeId }: TraineeFormContentProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Fetch existing trainee data if editing
  const { data: trainee, isLoading: isLoadingTrainee } = useTrainee(traineeId || "");
  const updateTraineeMutation = useUpdateTrainee();

  const [formData, setFormData] = useState<FormData>({
    trainee_code: "",
    full_name: "",
    furigana: "",
    trainee_type: "",
    birth_date: "",
    birthplace: "",
    gender: "",
    marital_status: "",
    cccd_number: "",
    cccd_date: "",
    cccd_place: "",
    passport_number: "",
    passport_date: "",
    ethnicity: "",
    phone: "",
    source: "",
    education_level: "",
    temp_address: "",
    email: "",
    permanent_address: "",
    facebook: "",
    parent_phone_1: "",
    parent_phone_2: "",
    simple_status: "Đăng ký mới",
    current_situation: "",
    registration_date: format(new Date(), "yyyy-MM-dd"),
    height: "",
    vision_left: "",
    vision_right: "",
    dominant_hand: "",
    hobbies: "",
    weight: "",
    smoking: "",
    tattoo: "",
    drinking: "",
    blood_group: "",
    health_status: "",
    notes: "",
    photo_url: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Populate form with trainee data when editing
  useEffect(() => {
    if (isEditMode && trainee) {
      setFormData({
        trainee_code: trainee.trainee_code || "",
        full_name: trainee.full_name || "",
        furigana: trainee.furigana || "",
        trainee_type: trainee.trainee_type || "",
        birth_date: trainee.birth_date || "",
        birthplace: trainee.birthplace || "",
        gender: trainee.gender || "",
        marital_status: trainee.marital_status || "",
        cccd_number: trainee.cccd_number || "",
        cccd_date: trainee.cccd_date || "",
        cccd_place: trainee.cccd_place || "",
        passport_number: trainee.passport_number || "",
        passport_date: trainee.passport_date || "",
        ethnicity: trainee.ethnicity || "",
        phone: trainee.phone || "",
        source: trainee.source || "",
        education_level: trainee.education_level || "",
        temp_address: trainee.temp_address || "",
        email: trainee.email || "",
        permanent_address: trainee.permanent_address || "",
        facebook: trainee.facebook || "",
        parent_phone_1: trainee.parent_phone_1 || "",
        parent_phone_2: trainee.parent_phone_2 || "",
        simple_status: trainee.simple_status || "Đăng ký mới",
        current_situation: trainee.current_situation || "",
        registration_date: trainee.registration_date || format(new Date(), "yyyy-MM-dd"),
        height: trainee.height?.toString() || "",
        vision_left: trainee.vision_left?.toString() || "",
        vision_right: trainee.vision_right?.toString() || "",
        dominant_hand: trainee.dominant_hand || "",
        hobbies: trainee.hobbies || "",
        weight: trainee.weight?.toString() || "",
        smoking: trainee.smoking || "",
        tattoo: trainee.tattoo ? "Có" : "Không",
        drinking: trainee.drinking || "",
        blood_group: trainee.blood_group || "",
        health_status: trainee.health_status || "",
        notes: trainee.notes || "",
        photo_url: trainee.photo_url || "",
      });
    }
  }, [isEditMode, trainee]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCCCDData = (data: any) => {
    if (data.full_name) updateField("full_name", data.full_name);
    if (data.birth_date) updateField("birth_date", data.birth_date);
    if (data.gender) updateField("gender", data.gender);
    if (data.cccd_number) updateField("cccd_number", data.cccd_number);
    if (data.cccd_date) updateField("cccd_date", data.cccd_date);
    if (data.cccd_place) updateField("cccd_place", data.cccd_place);
    if (data.permanent_address) updateField("permanent_address", data.permanent_address);
    if (data.ethnicity) updateField("ethnicity", data.ethnicity);
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.trainee_code.trim()) newErrors.trainee_code = "Bắt buộc";
    if (!formData.full_name.trim()) newErrors.full_name = "Bắt buộc";
    if (!formData.source.trim()) newErrors.source = "Bắt buộc";
    if (!formData.birth_date) newErrors.birth_date = "Bắt buộc";
    if (!formData.gender) newErrors.gender = "Bắt buộc";
    if (!formData.trainee_type) newErrors.trainee_type = "Bắt buộc";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildTraineeData = () => ({
    trainee_code: formData.trainee_code,
    full_name: formData.full_name,
    furigana: formData.furigana || null,
    trainee_type: formData.trainee_type as any,
    birth_date: formData.birth_date || null,
    birthplace: formData.birthplace || null,
    gender: formData.gender || null,
    marital_status: formData.marital_status || null,
    cccd_number: formData.cccd_number || null,
    cccd_date: formData.cccd_date || null,
    cccd_place: formData.cccd_place || null,
    passport_number: formData.passport_number || null,
    passport_date: formData.passport_date || null,
    ethnicity: formData.ethnicity || null,
    phone: formData.phone || null,
    source: formData.source || null,
    education_level: formData.education_level || null,
    temp_address: formData.temp_address || null,
    email: formData.email || null,
    permanent_address: formData.permanent_address || null,
    facebook: formData.facebook || null,
    parent_phone_1: formData.parent_phone_1 || null,
    parent_phone_2: formData.parent_phone_2 || null,
    simple_status: formData.simple_status as any,
    current_situation: formData.current_situation || null,
    registration_date: formData.registration_date || null,
    height: formData.height ? parseFloat(formData.height) : null,
    vision_left: formData.vision_left ? parseFloat(formData.vision_left) : null,
    vision_right: formData.vision_right ? parseFloat(formData.vision_right) : null,
    dominant_hand: formData.dominant_hand || null,
    hobbies: formData.hobbies || null,
    weight: formData.weight ? parseFloat(formData.weight) : null,
    smoking: formData.smoking || null,
    tattoo: formData.tattoo === "Có",
    drinking: formData.drinking || null,
    blood_group: formData.blood_group || null,
    health_status: formData.health_status || null,
    notes: formData.notes || null,
    photo_url: formData.photo_url || null,
  });

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Vui lòng điền đầy đủ các trường bắt buộc",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const traineeData = buildTraineeData();

      if (isEditMode && traineeId) {
        await updateTraineeMutation.mutateAsync({
          id: traineeId,
          updates: traineeData,
        });
        toast({ title: "Cập nhật học viên thành công" });
      } else {
        const { error } = await supabase.from("trainees").insert(traineeData);
        if (error) throw error;
        toast({ title: "Thêm học viên thành công" });
      }

      navigate("/trainees");
    } catch (error: any) {
      toast({
        title: isEditMode ? "Lỗi khi cập nhật học viên" : "Lỗi khi thêm học viên",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to determine if field is empty (for styling)
  const getInputClass = (value: string, hasError?: string) => {
    return cn(
      hasError && "border-destructive",
      !value && !hasError && "input-empty"
    );
  };

  const getSelectClass = (value: string, hasError?: string) => {
    return cn(
      "select-trigger",
      hasError && "border-destructive",
      !value && !hasError && "[&[data-placeholder]]:bg-[hsl(var(--input-empty)/0.18)] [&[data-placeholder]]:border-[hsl(var(--input-empty))]"
    );
  };

  if (isEditMode && isLoadingTrainee) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/trainees")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-primary">
            Học viên: {formData.trainee_code || "Mới"} - {formData.full_name || "Chưa có tên"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/trainees")}>
            Hủy bỏ
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditMode ? "Cập nhật" : "Lưu lại"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger
            value="personal"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Thông tin cá nhân
          </TabsTrigger>
          <TabsTrigger value="history">Lý lịch cá nhân</TabsTrigger>
          <TabsTrigger value="project">Dự án và Phỏng vấn</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Form - Left Side */}
            <div className="lg:col-span-3 space-y-4">
              {/* Thông tin Học viên */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-primary text-base">Thông tin Học viên</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    {/* Photo Upload */}
                    <PhotoUpload
                      currentPhotoUrl={formData.photo_url}
                      onPhotoChange={(url) => updateField("photo_url", url || "")}
                      traineeCode={formData.trainee_code}
                    />

                    {/* First Row */}
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Họ và Tên <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="NGUYỄN VĂN A"
                          value={formData.full_name}
                          onChange={(e) => updateField("full_name", e.target.value.toUpperCase())}
                          className={getInputClass(formData.full_name, errors.full_name)}
                        />
                        {errors.full_name && (
                          <span className="text-xs text-destructive">{errors.full_name}</span>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Tên học viên (Furigana)</Label>
                        <Input
                          placeholder="ア"
                          value={formData.furigana}
                          onChange={(e) => updateField("furigana", e.target.value)}
                          className={getInputClass(formData.furigana)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Đối tượng <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.trainee_type}
                          onValueChange={(v) => updateField("trainee_type", v)}
                        >
                          <SelectTrigger className={getSelectClass(formData.trainee_type, errors.trainee_type)}>
                            <SelectValue placeholder="Chọn" />
                          </SelectTrigger>
                          <SelectContent>
                            {TRAINEE_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Second Row */}
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Ngày sinh <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => updateField("birth_date", e.target.value)}
                        className={getInputClass(formData.birth_date, errors.birth_date)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Nơi sinh</Label>
                      <Select
                        value={formData.birthplace}
                        onValueChange={(v) => updateField("birthplace", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.birthplace)}>
                          <SelectValue placeholder="Chọn tỉnh/thành" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVINCES.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Giới tính <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(v) => updateField("gender", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.gender, errors.gender)}>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDERS.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Hôn nhân</Label>
                      <Select
                        value={formData.marital_status}
                        onValueChange={(v) => updateField("marital_status", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.marital_status)}>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          {MARITAL_STATUSES.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Third Row - Documents */}
                  <div className="grid grid-cols-5 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Mã HV <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="009415"
                        value={formData.trainee_code}
                        onChange={(e) => updateField("trainee_code", e.target.value)}
                        className={getInputClass(formData.trainee_code, errors.trainee_code)}
                        disabled={isEditMode}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Số CCCD/CMND</Label>
                      <Input
                        placeholder="001234567890"
                        value={formData.cccd_number}
                        onChange={(e) => updateField("cccd_number", e.target.value)}
                        className={getInputClass(formData.cccd_number)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày cấp CCCD</Label>
                      <Input
                        type="date"
                        value={formData.cccd_date}
                        onChange={(e) => updateField("cccd_date", e.target.value)}
                        className={getInputClass(formData.cccd_date)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Số hộ chiếu</Label>
                      <Input
                        placeholder="B1234567"
                        value={formData.passport_number}
                        onChange={(e) => updateField("passport_number", e.target.value)}
                        className={getInputClass(formData.passport_number)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày cấp HC</Label>
                      <Input
                        type="date"
                        value={formData.passport_date}
                        onChange={(e) => updateField("passport_date", e.target.value)}
                        className={getInputClass(formData.passport_date)}
                      />
                    </div>
                  </div>

                  {/* Fourth Row */}
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Dân tộc</Label>
                      <Select
                        value={formData.ethnicity}
                        onValueChange={(v) => updateField("ethnicity", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.ethnicity)}>
                          <SelectValue placeholder="Chọn dân tộc" />
                        </SelectTrigger>
                        <SelectContent>
                          {ETHNICITIES.map((e) => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Số điện thoại</Label>
                      <Input
                        placeholder="0901234567"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className={getInputClass(formData.phone)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Nguồn <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.source}
                        onValueChange={(v) => updateField("source", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.source, errors.source)}>
                          <SelectValue placeholder="Chọn nguồn" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Trình độ</Label>
                      <Select
                        value={formData.education_level}
                        onValueChange={(v) => updateField("education_level", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.education_level)}>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          {EDUCATION_LEVELS.map((e) => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Địa chỉ & Liên hệ */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-primary text-base">Địa chỉ & Liên hệ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Địa chỉ Tạm trú</Label>
                      <Input
                        placeholder="Địa chỉ hiện tại"
                        value={formData.temp_address}
                        onChange={(e) => updateField("temp_address", e.target.value)}
                        className={getInputClass(formData.temp_address)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email / Zalo</Label>
                      <Input
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className={getInputClass(formData.email)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Địa chỉ Thường trú</Label>
                      <Input
                        placeholder="Địa chỉ hộ khẩu"
                        value={formData.permanent_address}
                        onChange={(e) => updateField("permanent_address", e.target.value)}
                        className={getInputClass(formData.permanent_address)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Kết nối khác (Facebook, Viber...)</Label>
                      <Input
                        placeholder="https://facebook.com/..."
                        value={formData.facebook}
                        onChange={(e) => updateField("facebook", e.target.value)}
                        className={getInputClass(formData.facebook)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">SĐT Phụ huynh 1</Label>
                      <Input
                        placeholder="0901234567"
                        value={formData.parent_phone_1}
                        onChange={(e) => updateField("parent_phone_1", e.target.value)}
                        className={getInputClass(formData.parent_phone_1)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">SĐT Phụ huynh 2</Label>
                      <Input
                        placeholder="0901234567"
                        value={formData.parent_phone_2}
                        onChange={(e) => updateField("parent_phone_2", e.target.value)}
                        className={getInputClass(formData.parent_phone_2)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Thông tin sức khỏe */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-primary text-base">Thông tin sức khỏe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-6 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Chiều cao</Label>
                      <Input
                        placeholder="170"
                        value={formData.height}
                        onChange={(e) => updateField("height", e.target.value)}
                        className={getInputClass(formData.height)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Thị lực Trái</Label>
                      <Input
                        placeholder="1.0"
                        value={formData.vision_left}
                        onChange={(e) => updateField("vision_left", e.target.value)}
                        className={getInputClass(formData.vision_left)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Thị lực Phải</Label>
                      <Input
                        placeholder="1.0"
                        value={formData.vision_right}
                        onChange={(e) => updateField("vision_right", e.target.value)}
                        className={getInputClass(formData.vision_right)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tay thuận</Label>
                      <Select
                        value={formData.dominant_hand}
                        onValueChange={(v) => updateField("dominant_hand", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.dominant_hand)}>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOMINANT_HANDS.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Sở thích</Label>
                      <Input
                        placeholder="Nghe nhạc, thể thao..."
                        value={formData.hobbies}
                        onChange={(e) => updateField("hobbies", e.target.value)}
                        className={getInputClass(formData.hobbies)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Cân nặng</Label>
                      <Input
                        placeholder="65"
                        value={formData.weight}
                        onChange={(e) => updateField("weight", e.target.value)}
                        className={getInputClass(formData.weight)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Hút thuốc</Label>
                      <Select
                        value={formData.smoking}
                        onValueChange={(v) => updateField("smoking", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.smoking)}>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          {SMOKING_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Hình xăm</Label>
                      <Select
                        value={formData.tattoo}
                        onValueChange={(v) => updateField("tattoo", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.tattoo)}>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          {YES_NO.map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Uống rượu</Label>
                      <Select
                        value={formData.drinking}
                        onValueChange={(v) => updateField("drinking", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.drinking)}>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          {DRINKING_OPTIONS.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Nhóm máu</Label>
                      <Select
                        value={formData.blood_group}
                        onValueChange={(v) => updateField("blood_group", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.blood_group)}>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_GROUPS.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Sức khỏe</Label>
                      <Input
                        placeholder="Đạt"
                        value={formData.health_status}
                        onChange={(e) => updateField("health_status", e.target.value)}
                        className={getInputClass(formData.health_status)}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <Card className="bg-muted/30">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm font-medium">Ghi chú</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Nhập ghi chú về học viên..."
                        value={formData.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                        className={cn("min-h-24", getInputClass(formData.notes))}
                      />
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-semibold">Trạng thái</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Trạng thái</Label>
                    <Select
                      value={formData.simple_status}
                      onValueChange={(v) => updateField("simple_status", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIMPLE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tình trạng hiện tại</Label>
                    <Select
                      value={formData.current_situation}
                      onValueChange={(v) => updateField("current_situation", v)}
                    >
                      <SelectTrigger className={getSelectClass(formData.current_situation)}>
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Đang đi làm", "Thất nghiệp", "Đang đi học", "Khác"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Ngày đăng ký</Label>
                    <Input
                      type="date"
                      value={formData.registration_date}
                      onChange={(e) => updateField("registration_date", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-semibold">Quét CCCD</CardTitle>
                </CardHeader>
                <CardContent>
                  <CCCDScanner onDataExtracted={handleCCCDData} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-8 text-center text-muted-foreground">
            <p>Lý lịch cá nhân sẽ được thêm sau khi tạo học viên</p>
          </Card>
        </TabsContent>

        <TabsContent value="project">
          <Card className="p-8 text-center text-muted-foreground">
            <p>Thông tin dự án và phỏng vấn sẽ được thêm sau khi tạo học viên</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
