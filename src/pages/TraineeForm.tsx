import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { PhotoUpload, uploadPhoto } from "@/components/trainees/PhotoUpload";
import { LineQRUpload, uploadLineQR } from "@/components/trainees/LineQRUpload";
import { useTrainee, useUpdateTrainee } from "@/hooks/useTrainees";
import { useKatakanaConverter } from "@/hooks/useKatakanaConverter";
import { useUserRole } from "@/hooks/useUserRole";
import { useDataMasking } from "@/hooks/useSecureData";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { MultiSelect } from "@/components/ui/multi-select";
import { EducationHistoryForm, EducationItem } from "@/components/trainees/forms/EducationHistoryForm";
import { WorkHistoryForm, WorkItem } from "@/components/trainees/forms/WorkHistoryForm";
import { FamilyMembersForm, FamilyItem } from "@/components/trainees/forms/FamilyMembersForm";
import { JapanRelativesForm, JapanRelativeItem } from "@/components/trainees/forms/JapanRelativesForm";
import { ProjectInterviewForm } from "@/components/trainees/forms/ProjectInterviewForm";
import { useEducationHistory, useWorkHistory, useFamilyMembers, useJapanRelatives, useInterviewHistory } from "@/hooks/useTraineeHistory";
import { useDuplicateCheck, getDuplicateErrorMessage } from "@/hooks/useDuplicateCheck";

// Photo file states removed - no more draft system

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
const PARENT_RELATIONS = ["Cha", "Mẹ", "Anh", "Chị", "Em", "Ông", "Bà", "Cô", "Dì", "Chú", "Bác", "Vợ", "Chồng", "Khác"];
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
  "Chưa đậu", "Đậu phỏng vấn", "Nộp hồ sơ", "OTIT", "Nyukan", "COE",
  "Xuất cảnh", "Đang làm việc", "Hoàn thành hợp đồng", "Bỏ trốn", "Về trước hạn"
];
// Display labels for progression stages
const PROGRESSION_STAGE_LABELS: Record<string, string> = {
  "Hoàn thành hợp đồng": "Hoàn thành HĐ/ về nước"
};

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
  passport_place: string;
  ethnicity: string;
  religion: string;
  policy_category: string;
  phone: string;
  source: string;
  education_level: string;
  current_address: string;
  email: string;
  permanent_address: string;
  permanent_address_new: string;
  facebook: string;
  parent_phone_1: string;
  parent_phone_1_relation: string;
  parent_phone_2: string;
  parent_phone_2_relation: string;
  parent_phone_3: string;
  parent_phone_3_relation: string;
  simple_status: string;
  progression_stage: string;
  registration_date: string;
  height: string;
  vision_left: string;
  vision_right: string;
  dominant_hand: string;
  hobbies: string[];  // Changed to array for multi-select
  weight: string;
  smoking: string;
  tattoo: string;
  tattoo_description: string;
  drinking: string;
  blood_group: string;
  health_status: string;
  hearing: string;
  hepatitis_b: string;
  notes: string;
  photo_url: string;
  line_qr_url: string;
  pants_size: string;
  shirt_size: string;
  shoe_size: string;
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
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const { convertToKatakana } = useKatakanaConverter();
  const { isAdmin } = useUserRole();
  const { canViewUnmasked } = useDataMasking();
  
  // Admin và Nhân viên cấp cao có thể xem/sửa trường nhạy cảm
  const canEditSensitiveFields = canViewUnmasked;

  // History form states
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [educationItems, setEducationItems] = useState<EducationItem[]>([]);
  const [familyItems, setFamilyItems] = useState<FamilyItem[]>([]);
  const [japanRelativeItems, setJapanRelativeItems] = useState<JapanRelativeItem[]>([]);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingLineQRFile, setPendingLineQRFile] = useState<File | null>(null);

  // Hooks
  const { data: trainee } = useTrainee(traineeId || "");
  const updateTraineeMutation = useUpdateTrainee();

  // Get references data
  const { data: hobbies = [] } = useQuery({
    queryKey: ["hobbies"],
    queryFn: async () => {
      const { data } = await supabase.from("hobbies").select("*");
      return data || [];
    },
  });

  const { data: religions = [] } = useQuery({
    queryKey: ["religions"],
    queryFn: async () => {
      const { data } = await supabase.from("religions").select("*");
      return data || [];
    },
  });

  const { data: cccdPlaces = [] } = useQuery({
    queryKey: ["cccd_places"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cccd_places")
        .select("*")
        .order("name");
      return data || [];
    },
  });

  const { data: passportPlaces = [] } = useQuery({
    queryKey: ["passport_places"],
    queryFn: async () => {
      const { data } = await supabase
        .from("passport_places")
        .select("*")
        .order("name");
      return data || [];
    },
  });

  const { data: policyCategories = [] } = useQuery({
    queryKey: ["policy_categories"],
    queryFn: async () => {
      const { data } = await supabase.from("policy_categories").select("*");
      return data || [];
    },
  });

  const { data: referralSources = [] } = useQuery({
    queryKey: ["referral_sources"],
    queryFn: async () => {
      const { data } = await supabase.from("referral_sources").select("*");
      return data || [];
    },
  });

  // Initial form data
  const [formData, setFormData] = useState<FormData>({
    trainee_code: "",
    full_name: "",
    furigana: "",
    trainee_type: "Thực tập sinh",
    birth_date: "",
    birthplace: "",
    gender: "",
    marital_status: "",
    cccd_number: "",
    cccd_date: "",
    cccd_place: "",
    passport_number: "",
    passport_date: "",
    passport_place: "",
    ethnicity: "",
    religion: "",
    policy_category: "",
    phone: "",
    source: "",
    education_level: "",
    current_address: "",
    email: "",
    permanent_address: "",
    permanent_address_new: "",
    facebook: "",
    parent_phone_1: "",
    parent_phone_1_relation: "",
    parent_phone_2: "",
    parent_phone_2_relation: "",
    parent_phone_3: "",
    parent_phone_3_relation: "",
    simple_status: "Đăng ký mới",
    progression_stage: "Chưa đậu",
    registration_date: format(new Date(), "yyyy-MM-dd"),
    height: "",
    vision_left: "",
    vision_right: "",
    dominant_hand: "",
    hobbies: [],
    weight: "",
    smoking: "",
    tattoo: "Không",
    tattoo_description: "",
    drinking: "",
    blood_group: "",
    health_status: "",
    hearing: "",
    hepatitis_b: "",
    notes: "",
    photo_url: "",
    line_qr_url: "",
    pants_size: "",
    shirt_size: "",
    shoe_size: "",
    entry_date: "",
    reserve_date: "",
    stop_date: "",
    cancel_date: "",
    interview_pass_date: "",
    document_submission_date: "",
    otit_entry_date: "",
    nyukan_entry_date: "",
    coe_date: "",
    departure_date: "",
    absconded_date: "",
    early_return_date: "",
    early_return_reason: "",
    return_date: "",
  });

  // Real-time duplicate check for trainee code
  const { isDuplicate: isCodeDuplicate, isChecking: isCheckingCode } = useDuplicateCheck(
    formData.trainee_code,
    "trainees",
    "trainee_code",
    isEditMode ? traineeId : undefined
  );

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
        passport_place: (trainee as any).passport_place || "",
        ethnicity: trainee.ethnicity || "",
        religion: (trainee as any).religion || "",
        policy_category: (trainee as any).policy_category || "",
        phone: trainee.phone || "",
        source: trainee.source || "",
        education_level: trainee.education_level || "",
        current_address: trainee.current_address || "",
        email: trainee.email || "",
        permanent_address: trainee.permanent_address || "",
        permanent_address_new: (trainee as any).permanent_address_new || "",
        facebook: trainee.facebook || "",
        parent_phone_1: trainee.parent_phone_1 || "",
        parent_phone_1_relation: (trainee as any).parent_phone_1_relation || "",
        parent_phone_2: trainee.parent_phone_2 || "",
        parent_phone_2_relation: (trainee as any).parent_phone_2_relation || "",
        parent_phone_3: (trainee as any).parent_phone_3 || "",
        parent_phone_3_relation: (trainee as any).parent_phone_3_relation || "",
        simple_status: trainee.simple_status || "Đăng ký mới",
        progression_stage: trainee.progression_stage || "Chưa đậu",
        registration_date: trainee.registration_date || format(new Date(), "yyyy-MM-dd"),
        height: trainee.height?.toString() || "",
        vision_left: trainee.vision_left?.toString() || "",
        vision_right: trainee.vision_right?.toString() || "",
        dominant_hand: trainee.dominant_hand || "",
        hobbies: trainee.hobbies ? trainee.hobbies.split(", ").filter(Boolean) : [],
        weight: trainee.weight?.toString() || "",
        smoking: trainee.smoking || "",
        tattoo: trainee.tattoo ? "Có" : "Không",
        tattoo_description: (trainee as any).tattoo_description || "",
        drinking: trainee.drinking || "",
        blood_group: trainee.blood_group || "",
        health_status: trainee.health_status || "",
        hearing: (trainee as any).hearing || "",
        hepatitis_b: (trainee as any).hepatitis_b || "",
        notes: trainee.notes || "",
        photo_url: trainee.photo_url || "",
        line_qr_url: (trainee as any).line_qr_url || "",
        pants_size: (trainee as any).pants_size || "",
        shirt_size: (trainee as any).shirt_size || "",
        shoe_size: (trainee as any).shoe_size || "",
        // Status-related dates
        entry_date: trainee.entry_date || "",
        reserve_date: (trainee as any).reserve_date || "",
        stop_date: (trainee as any).stop_date || "",
        cancel_date: (trainee as any).cancel_date || "",
        // Progression stage dates
        interview_pass_date: trainee.interview_pass_date || "",
        document_submission_date: trainee.document_submission_date || "",
        otit_entry_date: trainee.otit_entry_date || "",
        nyukan_entry_date: trainee.nyukan_entry_date || "",
        coe_date: trainee.coe_date || "",
        departure_date: trainee.departure_date || "",
        absconded_date: trainee.absconded_date || "",
        early_return_date: trainee.early_return_date || "",
        early_return_reason: trainee.early_return_reason || "",
        return_date: trainee.return_date || "",
      });
    }
  }, [isEditMode, trainee]);

  const [educationLoaded, setEducationLoaded] = useState(false);
  const [workLoaded, setWorkLoaded] = useState(false);
  const [familyLoaded, setFamilyLoaded] = useState(false);
  const [japanLoaded, setJapanLoaded] = useState(false);

  // Load related data
  useEducationHistory(traineeId, (items) => {
    if (!educationLoaded) {
      setEducationItems(items);
      setEducationLoaded(true);
    }
  });

  useWorkHistory(traineeId, (items) => {
    if (!workLoaded) {
      setWorkItems(items);
      setWorkLoaded(true);
    }
  });

  useFamilyMembers(traineeId, (items) => {
    if (!familyLoaded) {
      setFamilyItems(items);
      setFamilyLoaded(true);
    }
  });

  useJapanRelatives(traineeId, (items) => {
    if (!japanLoaded) {
      setJapanRelativeItems(items);
      setJapanLoaded(true);
    }
  });

  // Handle field changes
  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // BUSINESS RULE: Auto-remove dormitory & classes khi thay đổi simple_status
      // Nếu chuyển sang "Hủy" hoặc "Dừng chương trình" hoặc trạng thái terminal khác
      if (field === "simple_status") {
        if (
          value === "Hủy" ||
          value === "Dừng chương trình" ||
          value === "Không học" ||
          value === "Rời công ty"
        ) {
          // Auto remove từ dormitory and classes sẽ được xử lý bởi RPC backend
        }

        // BUSINESS RULE: Xóa date không liên quan khi đổi simple_status
        // Đảm bảo dữ liệu sạch - không giữ date của trạng thái cũ
        if (value !== "Bảo lưu") {
          newData.reserve_date = "";
        }
        if (value !== "Hủy") {
          newData.cancel_date = "";
        }
        if (value !== "Dừng chương trình") {
          newData.stop_date = "";
        }
      }

      // Auto remove dormitory and classes when progression_stage changes (back-end handles this)
      if (field === "progression_stage") {
        if (
          value === "Xuất cảnh" ||
          value === "Đang làm việc" ||
          value === "Hoàn thành hợp đồng" ||
          value === "Bỏ trốn" ||
          value === "Về trước hạn"
        ) {
          // Auto removal logic is on the backend via RPC
        }

        // Reset dates when returning to early stages
        if (
          value === "Chưa đậu" ||
          value === "Đậu phỏng vấn"
        ) {
          newData.otit_entry_date = "";
          newData.nyukan_entry_date = "";
          newData.coe_date = "";
          newData.departure_date = "";
          newData.absconded_date = "";
          newData.early_return_date = "";
          newData.early_return_reason = "";
          newData.return_date = "";
        }
      }

      return newData;
    });
  }, []);
  
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/trainees")}
            className="p-2 hover:bg-muted rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditMode ? "Chỉnh sửa hồ sơ" : "Thêm hồ sơ mới"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditMode ? "Cập nhật thông tin học viên" : "Tạo hồ sơ học viên mới"}
            </p>
          </div>
        </div>
      </div>

      <Button disabled>Form Component Under Reconstruction</Button>
    </div>
  );
}
