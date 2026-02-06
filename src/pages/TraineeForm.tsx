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
import { Database } from "@/integrations/supabase/types";
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
    {
      table: "trainees",
      field: "trainee_code",
      currentId: isEditMode ? traineeId : undefined,
    }
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
  const { data: educationData } = useEducationHistory(traineeId);
  const { data: workData } = useWorkHistory(traineeId);
  const { data: familyData } = useFamilyMembers(traineeId);
  const { data: japanRelativesData } = useJapanRelatives(traineeId);

  // Sync education history data - map DB types to form types
  useEffect(() => {
    if (educationData && !educationLoaded) {
      const mapped = educationData.map(item => ({
        id: item.id,
        level: item.level || "",
        school_name: item.school_name || "",
        major: item.major || "",
        start_month: "",
        start_year: item.start_year?.toString() || "",
        end_month: "",
        end_year: item.end_year?.toString() || "",
      }));
      setEducationItems(mapped);
      setEducationLoaded(true);
    }
  }, [educationData, educationLoaded]);

  // Sync work history data - map DB types to form types
  useEffect(() => {
    if (workData && !workLoaded) {
      const mapped = workData.map(item => ({
        id: item.id,
        company_name: item.company_name || "",
        position: item.position || "",
        company_name_japanese: "",
        start_date: item.start_date || "",
        end_date: item.end_date || "",
      }));
      setWorkItems(mapped);
      setWorkLoaded(true);
    }
  }, [workData, workLoaded]);

  // Sync family members data - map DB types to form types
  useEffect(() => {
    if (familyData && !familyLoaded) {
      const mapped = familyData.map(item => ({
        id: item.id,
        relationship: item.relationship || "",
        gender: item.gender || "",
        full_name: item.full_name || "",
        birth_year: item.birth_year?.toString() || "",
        living_status: "",
        occupation: item.occupation || "",
        income: item.income || "",
      }));
      setFamilyItems(mapped);
      setFamilyLoaded(true);
    }
  }, [familyData, familyLoaded]);

  // Sync japan relatives data - map DB types to form types
  useEffect(() => {
    if (japanRelativesData && !japanLoaded) {
      const mapped = japanRelativesData.map(item => ({
        id: item.id,
        full_name: item.full_name || "",
        relationship: item.relationship || "",
        age: item.age?.toString() || "",
        gender: item.gender || "",
        address_japan: item.address_japan || "",
        residence_status: item.residence_status || "",
      }));
      setJapanRelativeItems(mapped);
      setJapanLoaded(true);
    }
  }, [japanRelativesData, japanLoaded]);

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
  
  // Build trainee data from form
  const buildTraineeData = (): Database["public"]["Tables"]["trainees"]["Insert"] => {
    const hobbiesString = Array.isArray(formData.hobbies) 
      ? formData.hobbies.join(", ") 
      : formData.hobbies;

    // Valid progression stages from enum
    const validProgressionStages = [
      "Chưa đậu", "Đậu phỏng vấn", "Nộp hồ sơ", "OTIT", "Nyukan", "COE", "Visa",
      "Xuất cảnh", "Đang làm việc", "Hoàn thành hợp đồng", "Bỏ trốn", "Về trước hạn"
    ] as const;
    
    const progressionStage = validProgressionStages.includes(formData.progression_stage as any)
      ? (formData.progression_stage as Database["public"]["Enums"]["progression_stage"])
      : null;

    return {
      trainee_code: formData.trainee_code,
      full_name: formData.full_name,
      furigana: formData.furigana || null,
      trainee_type: (formData.trainee_type as Database["public"]["Enums"]["trainee_type"]) || null,
      birth_date: formData.birth_date || null,
      birthplace: formData.birthplace || null,
      gender: formData.gender || null,
      marital_status: formData.marital_status || null,
      cccd_number: formData.cccd_number || null,
      cccd_date: formData.cccd_date || null,
      cccd_place: formData.cccd_place || null,
      passport_number: formData.passport_number || null,
      passport_date: formData.passport_date || null,
      passport_place: formData.passport_place || null,
      ethnicity: formData.ethnicity || null,
      religion: formData.religion || null,
      policy_category: formData.policy_category || null,
      phone: formData.phone || null,
      source: formData.source || null,
      education_level: formData.education_level || null,
      current_address: formData.current_address || null,
      email: formData.email || null,
      permanent_address: formData.permanent_address || null,
      permanent_address_new: formData.permanent_address_new || null,
      facebook: formData.facebook || null,
      parent_phone_1: formData.parent_phone_1 || null,
      parent_phone_1_relation: formData.parent_phone_1_relation || null,
      parent_phone_2: formData.parent_phone_2 || null,
      parent_phone_2_relation: formData.parent_phone_2_relation || null,
      parent_phone_3: formData.parent_phone_3 || null,
      parent_phone_3_relation: formData.parent_phone_3_relation || null,
      simple_status: (formData.simple_status as Database["public"]["Enums"]["simple_status"]) || null,
      progression_stage: progressionStage,
      registration_date: formData.registration_date || null,
      height: formData.height ? parseFloat(formData.height) : null,
      vision_left: formData.vision_left ? parseFloat(formData.vision_left) : null,
      vision_right: formData.vision_right ? parseFloat(formData.vision_right) : null,
      dominant_hand: formData.dominant_hand || null,
      hobbies: hobbiesString || null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      smoking: formData.smoking || null,
      tattoo: formData.tattoo === "Có",
      tattoo_description: formData.tattoo_description || null,
      drinking: formData.drinking || null,
      blood_group: formData.blood_group || null,
      health_status: formData.health_status || null,
      hearing: formData.hearing || null,
      hepatitis_b: formData.hepatitis_b || null,
      notes: formData.notes || null,
      photo_url: formData.photo_url || null,
      line_qr_url: formData.line_qr_url || null,
      pants_size: formData.pants_size || null,
      shirt_size: formData.shirt_size || null,
      shoe_size: formData.shoe_size || null,
      entry_date: formData.entry_date || null,
      reserve_date: formData.reserve_date || null,
      stop_date: formData.stop_date || null,
      cancel_date: formData.cancel_date || null,
      interview_pass_date: formData.interview_pass_date || null,
      document_submission_date: formData.document_submission_date || null,
      otit_entry_date: formData.otit_entry_date || null,
      nyukan_entry_date: formData.nyukan_entry_date || null,
      coe_date: formData.coe_date || null,
      departure_date: formData.departure_date || null,
      absconded_date: formData.absconded_date || null,
      early_return_date: formData.early_return_date || null,
      early_return_reason: formData.early_return_reason || null,
      return_date: formData.return_date || null,
    };
  };

  // Save history items
  const saveHistoryItems = async (traineeId: string) => {
    // Education history
    await supabase.from("education_history").delete().eq("trainee_id", traineeId);
    if (educationItems.length > 0) {
      const eduData = educationItems.map(item => ({
        trainee_id: traineeId,
        level: item.level || null,
        school_name: item.school_name,
        major: item.major || null,
        start_year: item.start_year ? parseInt(item.start_year) : null,
        end_year: item.end_year ? parseInt(item.end_year) : null,
      }));
      await supabase.from("education_history").insert(eduData);
    }

    // Work history
    await supabase.from("work_history").delete().eq("trainee_id", traineeId);
    if (workItems.length > 0) {
      const workData = workItems.map(item => ({
        trainee_id: traineeId,
        company_name: item.company_name,
        position: item.position || null,
        start_date: item.start_date || null,
        end_date: item.end_date || null,
      }));
      await supabase.from("work_history").insert(workData);
    }

    // Family members
    await supabase.from("family_members").delete().eq("trainee_id", traineeId);
    if (familyItems.length > 0) {
      const familyData = familyItems.map(item => ({
        trainee_id: traineeId,
        relationship: item.relationship,
        full_name: item.full_name,
        gender: item.gender || null,
        birth_year: item.birth_year ? parseInt(item.birth_year) : null,
        occupation: item.occupation || null,
        income: item.income || null,
      }));
      await supabase.from("family_members").insert(familyData);
    }

    // Japan relatives
    await supabase.from("japan_relatives").delete().eq("trainee_id", traineeId);
    if (japanRelativeItems.length > 0) {
      const japanData = japanRelativeItems.map(item => ({
        trainee_id: traineeId,
        full_name: item.full_name,
        relationship: item.relationship || null,
        age: item.age ? parseInt(item.age) : null,
        gender: item.gender || null,
        address_japan: item.address_japan || null,
        residence_status: item.residence_status || null,
      }));
      await supabase.from("japan_relatives").insert(japanData);
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.trainee_code || !formData.full_name) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã học viên và họ tên",
        variant: "destructive",
      });
      return;
    }

    if (isCodeDuplicate) {
      toast({
        title: "Lỗi",
        description: getDuplicateErrorMessage("trainees", "trainee_code"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const traineeData = buildTraineeData();
      let finalTraineeId = traineeId;

      if (isEditMode && traineeId) {
        // Update existing trainee
        await updateTraineeMutation.mutateAsync({
          id: traineeId,
          updates: traineeData,
        });

        // Upload photos if pending
        if (pendingPhotoFile) {
          const photoUrl = await uploadPhoto(pendingPhotoFile, traineeId);
          if (photoUrl) {
            await supabase.from("trainees").update({ photo_url: photoUrl }).eq("id", traineeId);
          }
        }
        if (pendingLineQRFile) {
          const lineQRUrl = await uploadLineQR(pendingLineQRFile, traineeId);
          if (lineQRUrl) {
            await supabase.from("trainees").update({ line_qr_url: lineQRUrl }).eq("id", traineeId);
          }
        }

        await saveHistoryItems(traineeId);
      } else {
        // Create new trainee
        const { data: newTrainee, error } = await supabase
          .from("trainees")
          .insert(traineeData)
          .select()
          .single();

        if (error) throw error;
        finalTraineeId = newTrainee.id;

        // Upload photos if pending
        if (pendingPhotoFile && finalTraineeId) {
          const photoUrl = await uploadPhoto(pendingPhotoFile, finalTraineeId);
          if (photoUrl) {
            await supabase.from("trainees").update({ photo_url: photoUrl }).eq("id", finalTraineeId);
          }
        }
        if (pendingLineQRFile && finalTraineeId) {
          const lineQRUrl = await uploadLineQR(pendingLineQRFile, finalTraineeId);
          if (lineQRUrl) {
            await supabase.from("trainees").update({ line_qr_url: lineQRUrl }).eq("id", finalTraineeId);
          }
        }

        await saveHistoryItems(finalTraineeId);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });

      toast({
        title: "Thành công",
        description: isEditMode ? "Đã cập nhật hồ sơ" : "Đã tạo hồ sơ mới",
      });

      navigate("/trainees");
    } catch (error: any) {
      console.error("Error saving trainee:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu hồ sơ",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClass = (value: string | undefined | null) => {
    return value ? "" : "input-empty";
  };

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
        <Button onClick={handleSubmit} disabled={isSubmitting || isCodeDuplicate}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Lưu
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4 mb-6">
          <TabsTrigger value="personal">Thông tin cá nhân</TabsTrigger>
          <TabsTrigger value="health">Sức khỏe</TabsTrigger>
          <TabsTrigger value="history">Lý lịch</TabsTrigger>
          <TabsTrigger value="status">Trạng thái</TabsTrigger>
        </TabsList>

        {/* Tab 1: Personal Info */}
        <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Photo & QR Column */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ảnh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PhotoUpload
                  currentPhotoUrl={formData.photo_url}
                  onPhotoChange={(url, file) => {
                    if (file) setPendingPhotoFile(file);
                    if (url) updateField("photo_url", url);
                  }}
                  traineeCode={formData.trainee_code || "new"}
                  previewOnly={!isEditMode}
                />
                <LineQRUpload
                  currentQRUrl={formData.line_qr_url}
                  onQRChange={(url, file) => {
                    if (file) setPendingLineQRFile(file);
                    if (url) updateField("line_qr_url", url);
                  }}
                  traineeCode={formData.trainee_code || "new"}
                  previewOnly={!isEditMode}
                />
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã học viên *</Label>
                  <Input
                    value={formData.trainee_code}
                    onChange={(e) => updateField("trainee_code", e.target.value)}
                    placeholder="VD: MK001"
                    className={cn(getInputClass(formData.trainee_code), isCodeDuplicate && "border-destructive")}
                  />
                  {isCodeDuplicate && (
                    <p className="text-xs text-destructive">{getDuplicateErrorMessage("trainees", "trainee_code")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Họ và tên *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => {
                      updateField("full_name", e.target.value.toUpperCase());
                      const katakana = convertToKatakana(e.target.value);
                      if (katakana) updateField("furigana", katakana);
                    }}
                    placeholder="NGUYỄN VĂN A"
                    className={getInputClass(formData.full_name)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Furigana</Label>
                  <Input
                    value={formData.furigana}
                    onChange={(e) => updateField("furigana", e.target.value)}
                    placeholder="グエン ヴァン アー"
                    className={getInputClass(formData.furigana)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Loại hình</Label>
                  <Select value={formData.trainee_type} onValueChange={(v) => updateField("trainee_type", v)}>
                    <SelectTrigger className={getInputClass(formData.trainee_type)}>
                      <SelectValue placeholder="Chọn loại hình" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINEE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ngày sinh</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => updateField("birth_date", e.target.value)}
                    className={getInputClass(formData.birth_date)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nơi sinh</Label>
                  <SearchableSelect
                    options={PROVINCES}
                    value={formData.birthplace}
                    onValueChange={(v) => updateField("birthplace", v)}
                    placeholder="Chọn tỉnh/thành"
                    className={getInputClass(formData.birthplace)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Giới tính</Label>
                  <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                    <SelectTrigger className={getInputClass(formData.gender)}>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tình trạng hôn nhân</Label>
                  <Select value={formData.marital_status} onValueChange={(v) => updateField("marital_status", v)}>
                    <SelectTrigger className={getInputClass(formData.marital_status)}>
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dân tộc</Label>
                  <Select value={formData.ethnicity} onValueChange={(v) => updateField("ethnicity", v)}>
                    <SelectTrigger className={getInputClass(formData.ethnicity)}>
                      <SelectValue placeholder="Chọn dân tộc" />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHNICITIES.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tôn giáo</Label>
                  <SearchableSelect
                    options={religions.map(r => ({ value: r.name, label: r.name }))}
                    value={formData.religion}
                    onValueChange={(v) => updateField("religion", v)}
                    placeholder="Chọn tôn giáo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trình độ học vấn</Label>
                  <Select value={formData.education_level} onValueChange={(v) => updateField("education_level", v)}>
                    <SelectTrigger className={getInputClass(formData.education_level)}>
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Diện chính sách</Label>
                  <SearchableSelect
                    options={policyCategories.map(p => ({ value: p.name, label: p.name }))}
                    value={formData.policy_category}
                    onValueChange={(v) => updateField("policy_category", v)}
                    placeholder="Chọn diện"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="0123456789"
                    className={getInputClass(formData.phone)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input
                    value={formData.facebook}
                    onChange={(e) => updateField("facebook", e.target.value)}
                    placeholder="Link hoặc username"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>SĐT Phụ huynh 1</Label>
                    <Input
                      value={formData.parent_phone_1}
                      onChange={(e) => updateField("parent_phone_1", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quan hệ</Label>
                    <Select value={formData.parent_phone_1_relation} onValueChange={(v) => updateField("parent_phone_1_relation", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PARENT_RELATIONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>SĐT Phụ huynh 2</Label>
                    <Input
                      value={formData.parent_phone_2}
                      onChange={(e) => updateField("parent_phone_2", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quan hệ</Label>
                    <Select value={formData.parent_phone_2_relation} onValueChange={(v) => updateField("parent_phone_2_relation", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PARENT_RELATIONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>SĐT Phụ huynh 3</Label>
                    <Input
                      value={formData.parent_phone_3}
                      onChange={(e) => updateField("parent_phone_3", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quan hệ</Label>
                    <Select value={formData.parent_phone_3_relation} onValueChange={(v) => updateField("parent_phone_3_relation", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PARENT_RELATIONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nguồn giới thiệu</Label>
                  <SearchableSelect
                    options={referralSources.map(s => ({ value: s.name, label: s.name }))}
                    value={formData.source}
                    onValueChange={(v) => updateField("source", v)}
                    placeholder="Chọn nguồn"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Giấy tờ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Số CCCD</Label>
                  <Input
                    value={formData.cccd_number}
                    onChange={(e) => updateField("cccd_number", e.target.value)}
                    placeholder="Số CCCD"
                    className={getInputClass(formData.cccd_number)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Ngày cấp CCCD</Label>
                    <Input
                      type="date"
                      value={formData.cccd_date}
                      onChange={(e) => updateField("cccd_date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nơi cấp CCCD</Label>
                    <SearchableSelect
                      options={cccdPlaces.map(p => ({ value: p.name, label: p.name }))}
                      value={formData.cccd_place}
                      onValueChange={(v) => updateField("cccd_place", v)}
                      placeholder="Chọn nơi cấp"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Số Hộ chiếu</Label>
                  <Input
                    value={formData.passport_number}
                    onChange={(e) => updateField("passport_number", e.target.value)}
                    placeholder="Số hộ chiếu"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Ngày cấp HC</Label>
                    <Input
                      type="date"
                      value={formData.passport_date}
                      onChange={(e) => updateField("passport_date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nơi cấp HC</Label>
                    <SearchableSelect
                      options={passportPlaces.map(p => ({ value: p.name, label: p.name }))}
                      value={formData.passport_place}
                      onValueChange={(v) => updateField("passport_place", v)}
                      placeholder="Chọn nơi cấp"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Địa chỉ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Địa chỉ hiện tại</Label>
                <Textarea
                  value={formData.current_address}
                  onChange={(e) => updateField("current_address", e.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                  className={getInputClass(formData.current_address)}
                />
              </div>
              <div className="space-y-2">
                <Label>Địa chỉ thường trú (trước sáp nhập)</Label>
                <Textarea
                  value={formData.permanent_address}
                  onChange={(e) => updateField("permanent_address", e.target.value)}
                  placeholder="Theo sổ hộ khẩu cũ"
                />
              </div>
              <div className="space-y-2">
                <Label>Địa chỉ thường trú (sau sáp nhập)</Label>
                <Textarea
                  value={formData.permanent_address_new}
                  onChange={(e) => updateField("permanent_address_new", e.target.value)}
                  placeholder="Theo địa giới hành chính mới"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Health */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thể chất</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chiều cao (cm)</Label>
                  <Input
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateField("height", e.target.value)}
                    placeholder="165"
                    className={getInputClass(formData.height)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cân nặng (kg)</Label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => updateField("weight", e.target.value)}
                    placeholder="55"
                    className={getInputClass(formData.weight)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thị lực trái</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.vision_left}
                    onChange={(e) => updateField("vision_left", e.target.value)}
                    placeholder="1.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thị lực phải</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.vision_right}
                    onChange={(e) => updateField("vision_right", e.target.value)}
                    placeholder="1.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nhóm máu</Label>
                  <Select value={formData.blood_group} onValueChange={(v) => updateField("blood_group", v)}>
                    <SelectTrigger className={getInputClass(formData.blood_group)}>
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tay thuận</Label>
                  <Select value={formData.dominant_hand} onValueChange={(v) => updateField("dominant_hand", v)}>
                    <SelectTrigger className={getInputClass(formData.dominant_hand)}>
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMINANT_HANDS.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sức khỏe & Thói quen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hút thuốc</Label>
                    <Select value={formData.smoking} onValueChange={(v) => updateField("smoking", v)}>
                      <SelectTrigger className={getInputClass(formData.smoking)}>
                        <SelectValue placeholder="Chọn..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SMOKING_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Uống rượu</Label>
                    <Select value={formData.drinking} onValueChange={(v) => updateField("drinking", v)}>
                      <SelectTrigger className={getInputClass(formData.drinking)}>
                        <SelectValue placeholder="Chọn..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DRINKING_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hình xăm</Label>
                    <Select value={formData.tattoo} onValueChange={(v) => updateField("tattoo", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn..." />
                      </SelectTrigger>
                      <SelectContent>
                        {YES_NO.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.tattoo === "Có" && (
                    <div className="space-y-2">
                      <Label>Mô tả xăm</Label>
                      <Input
                        value={formData.tattoo_description}
                        onChange={(e) => updateField("tattoo_description", e.target.value)}
                        placeholder="Vị trí, kích thước..."
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Tình trạng sức khỏe</Label>
                  <Textarea
                    value={formData.health_status}
                    onChange={(e) => updateField("health_status", e.target.value)}
                    placeholder="Ghi chú về sức khỏe..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Thính lực</Label>
                    <Input
                      value={formData.hearing}
                      onChange={(e) => updateField("hearing", e.target.value)}
                      placeholder="Bình thường"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Viêm gan B</Label>
                    <Select value={formData.hepatitis_b} onValueChange={(v) => updateField("hepatitis_b", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Âm tính">Âm tính</SelectItem>
                        <SelectItem value="Dương tính">Dương tính</SelectItem>
                        <SelectItem value="Chưa xét nghiệm">Chưa XN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Size & Hobbies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Size đồ</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Áo</Label>
                  <Input
                    value={formData.shirt_size}
                    onChange={(e) => updateField("shirt_size", e.target.value)}
                    placeholder="M, L, XL..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quần</Label>
                  <Input
                    value={formData.pants_size}
                    onChange={(e) => updateField("pants_size", e.target.value)}
                    placeholder="28, 30, 32..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giày</Label>
                  <Input
                    value={formData.shoe_size}
                    onChange={(e) => updateField("shoe_size", e.target.value)}
                    placeholder="39, 40, 41..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sở thích</CardTitle>
              </CardHeader>
              <CardContent>
                <MultiSelect
                  options={hobbies.map(h => h.name)}
                  value={formData.hobbies}
                  onValueChange={(selected) => updateField("hobbies", selected)}
                  placeholder="Chọn sở thích..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ghi chú</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Ghi chú thêm về học viên..."
                rows={4}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: History */}
        <TabsContent value="history" className="space-y-6">
          <EducationHistoryForm items={educationItems} onChange={setEducationItems} />
          <WorkHistoryForm items={workItems} onChange={setWorkItems} />
          <FamilyMembersForm items={familyItems} onChange={setFamilyItems} />
          <JapanRelativesForm items={japanRelativeItems} onChange={setJapanRelativeItems} />
        </TabsContent>

        {/* Tab 4: Status */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tình trạng học viên</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tình trạng</Label>
                  <Select value={formData.simple_status} onValueChange={(v) => updateField("simple_status", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tình trạng" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIMPLE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Giai đoạn</Label>
                  <Select value={formData.progression_stage} onValueChange={(v) => updateField("progression_stage", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giai đoạn" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRESSION_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {PROGRESSION_STAGE_LABELS[s] || s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ngày đăng ký</Label>
                  <Input
                    type="date"
                    value={formData.registration_date}
                    onChange={(e) => updateField("registration_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ngày nhập học</Label>
                  <Input
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => updateField("entry_date", e.target.value)}
                  />
                </div>

                {/* Status-specific dates */}
                {formData.simple_status === "Bảo lưu" && (
                  <div className="space-y-2">
                    <Label>Ngày bảo lưu</Label>
                    <Input
                      type="date"
                      value={formData.reserve_date}
                      onChange={(e) => updateField("reserve_date", e.target.value)}
                    />
                  </div>
                )}

                {formData.simple_status === "Dừng chương trình" && (
                  <div className="space-y-2">
                    <Label>Ngày dừng chương trình</Label>
                    <Input
                      type="date"
                      value={formData.stop_date}
                      onChange={(e) => updateField("stop_date", e.target.value)}
                    />
                  </div>
                )}

                {formData.simple_status === "Hủy" && (
                  <div className="space-y-2">
                    <Label>Ngày hủy</Label>
                    <Input
                      type="date"
                      value={formData.cancel_date}
                      onChange={(e) => updateField("cancel_date", e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Các mốc tiến trình</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ngày đậu phỏng vấn</Label>
                  <Input
                    type="date"
                    value={formData.interview_pass_date}
                    onChange={(e) => updateField("interview_pass_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ngày nộp hồ sơ</Label>
                  <Input
                    type="date"
                    value={formData.document_submission_date}
                    onChange={(e) => updateField("document_submission_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ngày nộp OTIT</Label>
                  <Input
                    type="date"
                    value={formData.otit_entry_date}
                    onChange={(e) => updateField("otit_entry_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ngày nộp Nyukan</Label>
                  <Input
                    type="date"
                    value={formData.nyukan_entry_date}
                    onChange={(e) => updateField("nyukan_entry_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ngày cấp COE</Label>
                  <Input
                    type="date"
                    value={formData.coe_date}
                    onChange={(e) => updateField("coe_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ngày xuất cảnh</Label>
                  <Input
                    type="date"
                    value={formData.departure_date}
                    onChange={(e) => updateField("departure_date", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Post-departure status */}
          {(formData.progression_stage === "Bỏ trốn" || 
            formData.progression_stage === "Về trước hạn" || 
            formData.progression_stage === "Hoàn thành hợp đồng") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sau xuất cảnh</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.progression_stage === "Bỏ trốn" && (
                  <div className="space-y-2">
                    <Label>Ngày bỏ trốn</Label>
                    <Input
                      type="date"
                      value={formData.absconded_date}
                      onChange={(e) => updateField("absconded_date", e.target.value)}
                    />
                  </div>
                )}

                {formData.progression_stage === "Về trước hạn" && (
                  <>
                    <div className="space-y-2">
                      <Label>Ngày về trước hạn</Label>
                      <Input
                        type="date"
                        value={formData.early_return_date}
                        onChange={(e) => updateField("early_return_date", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lý do về trước hạn</Label>
                      <Textarea
                        value={formData.early_return_reason}
                        onChange={(e) => updateField("early_return_reason", e.target.value)}
                        placeholder="Nhập lý do..."
                      />
                    </div>
                  </>
                )}

                {formData.progression_stage === "Hoàn thành hợp đồng" && (
                  <div className="space-y-2">
                    <Label>Ngày về nước</Label>
                    <Input
                      type="date"
                      value={formData.return_date}
                      onChange={(e) => updateField("return_date", e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
