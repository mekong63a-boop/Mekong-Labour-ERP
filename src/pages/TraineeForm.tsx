import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { useTrainee, useUpdateTrainee } from "@/hooks/useTrainees";
import { useKatakanaConverter } from "@/hooks/useKatakanaConverter";
import { useUserRole } from "@/hooks/useUserRole";
import { SearchableSelect } from "@/components/ui/searchable-select";

// Options
const TRAINEE_TYPES = ["Thực tập sinh", "Kỹ năng đặc định", "Kỹ sư", "Du học sinh", "Thực tập sinh số 3"];
const GENDERS = ["Nam", "Nữ"];
const MARITAL_STATUSES = ["Độc thân", "Đã kết hôn", "Ly hôn", "Góa"];
const SIMPLE_STATUSES = ["Đăng ký mới", "Đang học", "Bảo lưu", "Dừng chương trình", "Không học", "Hủy", "Đang ở Nhật", "Rời công ty"];
const EDUCATION_LEVELS = ["THCS", "THPT", "TTGDTX", "TRUNG CẤP", "CAO ĐẲNG", "ĐẠI HỌC"];
const ETHNICITIES = ["Kinh", "Tày", "Thái", "Mường", "Khmer", "Nùng", "H'Mông", "Dao", "Gia Rai", "Ê Đê", "Ba Na", "Khác"];
const BLOOD_GROUPS = ["A", "B", "AB", "O"];
const DOMINANT_HANDS = ["Tay phải", "Tay trái", "Cả hai"];
const YES_NO = ["Có", "Không"];
const SMOKING_OPTIONS = ["Không", "Thỉnh thoảng", "Thường xuyên"];
const DRINKING_OPTIONS = ["Không", "Thỉnh thoảng", "Thường xuyên"];
const PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh",
  "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước", "Bình Thuận", "Cà Mau",
  "Cao Bằng", "Cần Thơ", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai",
  "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương",
  "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang",
  "Kon Tum", "Lai Châu", "Lạng Sơn", "Lào Cai", "Lâm Đồng", "Long An", "Nam Định",
  "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
  "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La",
  "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang",
  "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];
const PROGRESSION_STAGES = [
  "Chưa đậu", "Đậu phỏng vấn", "Nộp hồ sơ", "OTIT", "Nyukan", "COE", "Visa", 
  "Xuất cảnh", "Đang làm việc", "Hoàn thành hợp đồng", "Bỏ trốn", "Về trước hạn"
];

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
  progression_stage: string;
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
  // Status-related dates
  entry_date: string;
  reserve_date: string;
  stop_date: string;
  cancel_date: string;
  // Progression stage dates
  interview_pass_date: string;
  document_submission_date: string;
  otit_entry_date: string;
  nyukan_entry_date: string;
  coe_date: string;
  visa_date: string;
  departure_date: string;
  absconded_date: string;
  early_return_date: string;
  early_return_reason: string;
  return_date: string;
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
  const { convertToKatakana } = useKatakanaConverter();
  const { isAdmin } = useUserRole();

  // Fetch referral sources from database
  const { data: referralSources = [] } = useQuery({
    queryKey: ["referral_sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_sources")
        .select("*")
        .order("name");
      if (error) throw error;
      return data?.map((s) => s.name) || [];
    },
  });

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
    progression_stage: "Chưa đậu",
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
    // Status-related dates
    entry_date: "",
    reserve_date: "",
    stop_date: "",
    cancel_date: "",
    // Progression stage dates
    interview_pass_date: "",
    document_submission_date: "",
    otit_entry_date: "",
    nyukan_entry_date: "",
    coe_date: "",
    visa_date: "",
    departure_date: "",
    absconded_date: "",
    early_return_date: "",
    early_return_reason: "",
    return_date: "",
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
        progression_stage: trainee.progression_stage || "Chưa đậu",
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
        // Status-related dates
        entry_date: trainee.entry_date || "",
        reserve_date: "",
        stop_date: "",
        cancel_date: "",
        // Progression stage dates
        interview_pass_date: trainee.interview_pass_date || "",
        document_submission_date: trainee.document_submission_date || "",
        otit_entry_date: trainee.otit_entry_date || "",
        nyukan_entry_date: trainee.nyukan_entry_date || "",
        coe_date: trainee.coe_date || "",
        visa_date: trainee.visa_date || "",
        departure_date: trainee.departure_date || "",
        absconded_date: trainee.absconded_date || "",
        early_return_date: trainee.early_return_date || "",
        early_return_reason: trainee.early_return_reason || "",
        return_date: trainee.return_date || "",
      });
    }
  }, [isEditMode, trainee]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle full name change - auto convert to uppercase and generate Katakana
  const handleFullNameChange = (value: string) => {
    const upperValue = value.toUpperCase();
    updateField("full_name", upperValue);
    
    // Auto-generate Katakana from the name
    const katakana = convertToKatakana(upperValue);
    if (katakana) {
      updateField("furigana", katakana);
    }
  };

  // Handle address fields - auto convert to uppercase
  const handleAddressChange = (field: keyof FormData, value: string) => {
    updateField(field, value.toUpperCase());
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.trainee_code.trim()) {
      newErrors.trainee_code = "Bắt buộc";
    } else if (!/^\d{6}$/.test(formData.trainee_code)) {
      newErrors.trainee_code = "Mã phải gồm 6 số";
    }
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
    progression_stage: formData.progression_stage as any || null,
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
    // Progression stage dates
    interview_pass_date: formData.interview_pass_date || null,
    document_submission_date: formData.document_submission_date || null,
    otit_entry_date: formData.otit_entry_date || null,
    nyukan_entry_date: formData.nyukan_entry_date || null,
    coe_date: formData.coe_date || null,
    visa_date: formData.visa_date || null,
    departure_date: formData.departure_date || null,
    entry_date: formData.entry_date || null,
    absconded_date: formData.absconded_date || null,
    early_return_date: formData.early_return_date || null,
    early_return_reason: formData.early_return_reason || null,
    return_date: formData.return_date || null,
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
                    {/* Photo Upload + Trainee Code */}
                    <div className="flex-shrink-0 space-y-2">
                      <PhotoUpload
                        currentPhotoUrl={formData.photo_url}
                        onPhotoChange={(url) => updateField("photo_url", url || "")}
                        traineeCode={formData.trainee_code}
                      />
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Mã học viên <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="123456"
                          value={formData.trainee_code}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            updateField("trainee_code", value);
                          }}
                          maxLength={6}
                          className={cn("w-24", getInputClass(formData.trainee_code, errors.trainee_code))}
                        />
                        {errors.trainee_code && (
                          <span className="text-xs text-destructive">{errors.trainee_code}</span>
                        )}
                      </div>
                    </div>

                    {/* First Row */}
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Họ và Tên <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="NGUYỄN VĂN A"
                          value={formData.full_name}
                          onChange={(e) => handleFullNameChange(e.target.value)}
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
                      <SearchableSelect
                        options={PROVINCES}
                        value={formData.birthplace}
                        onValueChange={(v) => updateField("birthplace", v)}
                        placeholder="Chọn tỉnh/thành"
                        searchPlaceholder="Tìm tỉnh/thành..."
                        emptyText="Không tìm thấy."
                      />
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
                  <div className="grid grid-cols-4 gap-3">
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
                      <SearchableSelect
                        options={ETHNICITIES}
                        value={formData.ethnicity}
                        onValueChange={(v) => updateField("ethnicity", v)}
                        placeholder="Chọn dân tộc"
                        searchPlaceholder="Tìm dân tộc..."
                        emptyText="Không tìm thấy."
                      />
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
                      <SearchableSelect
                        options={referralSources.length > 0 ? referralSources : ["Chưa có dữ liệu"]}
                        value={formData.source}
                        onValueChange={(v) => updateField("source", v)}
                        placeholder="Chọn nguồn"
                        searchPlaceholder="Tìm nguồn..."
                        emptyText="Không tìm thấy."
                        className={errors.source ? "border-destructive" : ""}
                      />
                      {errors.source && (
                        <span className="text-xs text-destructive">{errors.source}</span>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Trình độ</Label>
                      <SearchableSelect
                        options={EDUCATION_LEVELS}
                        value={formData.education_level}
                        onValueChange={(v) => updateField("education_level", v)}
                        placeholder="Chọn trình độ"
                        searchPlaceholder="Tìm trình độ..."
                        emptyText="Không tìm thấy."
                      />
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
                        placeholder="ĐỊA CHỈ HIỆN TẠI"
                        value={formData.temp_address}
                        onChange={(e) => handleAddressChange("temp_address", e.target.value)}
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
                        placeholder="ĐỊA CHỈ HỘ KHẨU"
                        value={formData.permanent_address}
                        onChange={(e) => handleAddressChange("permanent_address", e.target.value)}
                        className={getInputClass(formData.permanent_address)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Kết nối khác (Facebook, Viber...)</Label>
                      <Input
                        placeholder="https://facebook.com/..."
                        value={formData.facebook}
                        onChange={(e) => handleAddressChange("facebook", e.target.value)}
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
                  
                  {/* Conditional date fields based on simple_status */}
                  {formData.simple_status === "Đang học" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày nhập học</Label>
                      <Input
                        type="date"
                        value={formData.entry_date}
                        onChange={(e) => updateField("entry_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.simple_status === "Bảo lưu" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày bảo lưu</Label>
                      <Input
                        type="date"
                        value={formData.reserve_date}
                        onChange={(e) => updateField("reserve_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.simple_status === "Dừng chương trình" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày dừng chương trình</Label>
                      <Input
                        type="date"
                        value={formData.stop_date}
                        onChange={(e) => updateField("stop_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.simple_status === "Hủy" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày hủy</Label>
                      <Input
                        type="date"
                        value={formData.cancel_date}
                        onChange={(e) => updateField("cancel_date", e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-muted-foreground">Tình trạng tiến trình</Label>
                    <Select
                      value={formData.progression_stage}
                      onValueChange={(v) => updateField("progression_stage", v)}
                    >
                      <SelectTrigger className={getSelectClass(formData.progression_stage)}>
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRESSION_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conditional date fields based on progression_stage */}
                  {formData.progression_stage === "Đậu phỏng vấn" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày đậu PV</Label>
                      <Input
                        type="date"
                        value={formData.interview_pass_date}
                        onChange={(e) => updateField("interview_pass_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.progression_stage === "Nộp hồ sơ" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày nộp HS</Label>
                      <Input
                        type="date"
                        value={formData.document_submission_date}
                        onChange={(e) => updateField("document_submission_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.progression_stage === "OTIT" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày vào OTIT</Label>
                      <Input
                        type="date"
                        value={formData.otit_entry_date}
                        onChange={(e) => updateField("otit_entry_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.progression_stage === "Nyukan" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày vào Nyukan</Label>
                      <Input
                        type="date"
                        value={formData.nyukan_entry_date}
                        onChange={(e) => updateField("nyukan_entry_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.progression_stage === "COE" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày có COE</Label>
                      <Input
                        type="date"
                        value={formData.coe_date}
                        onChange={(e) => updateField("coe_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.progression_stage === "Visa" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày có Visa</Label>
                      <Input
                        type="date"
                        value={formData.visa_date}
                        onChange={(e) => updateField("visa_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.progression_stage === "Xuất cảnh" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày xuất cảnh</Label>
                      <Input
                        type="date"
                        value={formData.departure_date}
                        onChange={(e) => updateField("departure_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.progression_stage === "Đang làm việc" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày bắt đầu làm việc</Label>
                      <Input
                        type="date"
                        value={formData.entry_date}
                        onChange={(e) => updateField("entry_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.progression_stage === "Bỏ trốn" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày bỏ trốn</Label>
                      <Input
                        type="date"
                        value={formData.absconded_date}
                        onChange={(e) => updateField("absconded_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.progression_stage === "Hoàn thành hợp đồng" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Ngày hoàn thành HĐ</Label>
                      <Input
                        type="date"
                        value={formData.return_date}
                        onChange={(e) => updateField("return_date", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.progression_stage === "Về trước hạn" && (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground">Ngày về nước trước hạn</Label>
                        <Input
                          type="date"
                          value={formData.early_return_date}
                          onChange={(e) => updateField("early_return_date", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Lý do về trước hạn</Label>
                        <Textarea
                          placeholder="Nhập lý do..."
                          value={formData.early_return_reason}
                          onChange={(e) => updateField("early_return_reason", e.target.value)}
                          className="min-h-16"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="text-xs text-muted-foreground">Ngày đăng ký</Label>
                    <Input
                      type="date"
                      value={formData.registration_date}
                      disabled={!isAdmin}
                      readOnly={!isAdmin}
                      className={!isAdmin ? "bg-muted cursor-not-allowed" : ""}
                      onChange={(e) => updateField("registration_date", e.target.value)}
                    />
                    {!isEditMode && (
                      <p className="text-xs text-muted-foreground mt-1">Tự động lấy ngày hiện tại</p>
                    )}
                    {isEditMode && !isAdmin && (
                      <p className="text-xs text-muted-foreground mt-1">Chỉ Admin mới có thể chỉnh sửa</p>
                    )}
                  </div>
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
