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
  
  // Pending photo file for upload on save
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingLineQRFile, setPendingLineQRFile] = useState<File | null>(null);
  
  // History form states
  const [educationItems, setEducationItems] = useState<EducationItem[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [familyItems, setFamilyItems] = useState<FamilyItem[]>([]);
  const [japanRelativeItems, setJapanRelativeItems] = useState<JapanRelativeItem[]>([]);
  
  // Project & Interview form state
  const [projectData, setProjectData] = useState({
    order_id: "",
    interview_date: "",
    expected_entry_month: "",
    receiving_company_id: "",
    union_id: "",
    job_category_id: "",
    contract_term: "",
  });

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

  // Fetch policy categories from database
  const { data: policyCategories = [] } = useQuery({
    queryKey: ["policy_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data?.map((s) => s.name) || [];
    },
  });

  // Fetch religions from database
  const { data: religions = [] } = useQuery({
    queryKey: ["religions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("religions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data?.map((s) => s.name) || [];
    },
  });

  // Fetch hobbies from database
  const { data: hobbiesOptions = [] } = useQuery({
    queryKey: ["hobbies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hobbies")
        .select("*")
        .order("name");
      if (error) throw error;
      return data?.map((s) => s.name) || [];
    },
  });

  // Fetch CCCD places from database
  const { data: cccdPlaces = [] } = useQuery({
    queryKey: ["cccd-places"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cccd_places")
        .select("*")
        .order("name");
      if (error) throw error;
      return data?.map((s) => s.name) || [];
    },
  });

  // Fetch passport places from database
  const { data: passportPlaces = [] } = useQuery({
    queryKey: ["passport-places"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("passport_places")
        .select("*")
        .order("name");
      if (error) throw error;
      return data?.map((s) => s.name) || [];
    },
  });

  // Fetch existing trainee data if editing
  const { data: trainee, isLoading: isLoadingTrainee } = useTrainee(traineeId || "");
  const updateTraineeMutation = useUpdateTrainee();
  
  // Fetch history data for edit mode
  const { data: educationHistoryData } = useEducationHistory(traineeId || "");
  const { data: workHistoryData } = useWorkHistory(traineeId || "");
  const { data: familyMembersData } = useFamilyMembers(traineeId || "");
  const { data: japanRelativesData } = useJapanRelatives(traineeId || "");
  const { data: interviewHistoryData } = useInterviewHistory(traineeId || "");

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
    hobbies: [],  // Array for multi-select
    weight: "",
    smoking: "",
    tattoo: "",
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
    departure_date: "",
    absconded_date: "",
    early_return_date: "",
    early_return_reason: "",
    return_date: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Real-time duplicate check for trainee code
  const { isDuplicate: isCodeDuplicate, isChecking: isCheckingCode } = useDuplicateCheck(
    formData.trainee_code,
    {
      table: 'trainees',
      field: 'trainee_code',
      currentId: traineeId,
      enabled: formData.trainee_code.length === 6,
    }
  );

  // No debounce needed - removed draft system

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
        reserve_date: "",
        stop_date: "",
        cancel_date: "",
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

  // Flags to ensure we only load history data once (prevent overwriting user input)
  const [educationLoaded, setEducationLoaded] = useState(false);
  const [workLoaded, setWorkLoaded] = useState(false);
  const [familyLoaded, setFamilyLoaded] = useState(false);
  const [japanLoaded, setJapanLoaded] = useState(false);

  // Load education history (only once when data first arrives)
  useEffect(() => {
    if (isEditMode && educationHistoryData && !educationLoaded) {
      setEducationItems(educationHistoryData.map(item => ({
        id: item.id,
        level: item.level || "",
        school_name: item.school_name || "",
        major: item.major || "",
        start_month: "",
        start_year: item.start_year?.toString() || "",
        end_month: "",
        end_year: item.end_year?.toString() || "",
      })));
      setEducationLoaded(true);
    }
  }, [isEditMode, educationHistoryData, educationLoaded]);

  // Load work history (only once when data first arrives)
  useEffect(() => {
    if (isEditMode && workHistoryData && !workLoaded) {
      setWorkItems(workHistoryData.map(item => ({
        id: item.id,
        company_name: item.company_name || "",
        position: item.position || "",
        company_name_japanese: "",
        start_date: item.start_date || "",
        end_date: item.end_date || "",
      })));
      setWorkLoaded(true);
    }
  }, [isEditMode, workHistoryData, workLoaded]);

  // Load family members (only once when data first arrives)
  useEffect(() => {
    if (isEditMode && familyMembersData && !familyLoaded) {
      setFamilyItems(familyMembersData.map(item => ({
        id: item.id,
        relationship: item.relationship || "",
        gender: item.gender || "",
        full_name: item.full_name || "",
        birth_year: item.birth_year?.toString() || "",
        living_status: item.location || "",
        occupation: item.occupation || "",
        income: item.income || "",
      })));
      setFamilyLoaded(true);
    }
  }, [isEditMode, familyMembersData, familyLoaded]);

  // Load japan relatives (only once when data first arrives)
  useEffect(() => {
    if (isEditMode && japanRelativesData && !japanLoaded) {
      setJapanRelativeItems(japanRelativesData.map(item => ({
        id: item.id,
        full_name: item.full_name || "",
        relationship: item.relationship || "",
        age: item.age?.toString() || "",
        gender: item.gender || "",
        address_japan: item.address_japan || "",
        residence_status: item.residence_status || "",
      })));
      setJapanLoaded(true);
    }
  }, [isEditMode, japanRelativesData, japanLoaded]);

  // Load project data from trainee and interview history when editing
  useEffect(() => {
    if (isEditMode && trainee) {
      // Lấy interview history mới nhất để load dữ liệu
      const latestInterview = interviewHistoryData?.[0]; // Đã được sắp xếp theo interview_date DESC
      
      setProjectData({
        order_id: "",  // Order is not stored on trainee directly
        interview_date: latestInterview?.interview_date || "",
        expected_entry_month: latestInterview?.expected_entry_month || trainee.expected_entry_month || "",
        receiving_company_id: latestInterview?.company_id || trainee.receiving_company_id || "",
        union_id: latestInterview?.union_id || trainee.union_id || "",
        job_category_id: latestInterview?.job_category_id || trainee.job_category_id || "",
        contract_term: trainee.contract_term?.toString() || "",
      });
    }
  }, [isEditMode, trainee, interviewHistoryData]);

  // CRITICAL: Các stage trước xuất cảnh - nếu đổi về đây thì phải xóa departure_date
  const PRE_DEPARTURE_STAGES = ["Chưa đậu", "Đậu phỏng vấn", "Nộp hồ sơ", "OTIT", "Nyukan", "COE"];
  
  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Logic xử lý khi thay đổi progression_stage
      if (field === "progression_stage") {
        const japanStages = ["Xuất cảnh", "Đang làm việc"];
        
        // Auto-change simple_status to "Đang ở Nhật" when progression_stage changes to "Xuất cảnh" or later stages
        if (japanStages.includes(value)) {
          newData.simple_status = "Đang ở Nhật";
        }
        
        // CRITICAL: Khi đổi về các stage TRƯỚC xuất cảnh, tự động xóa departure_date
        // Điều này đảm bảo học viên có thể được gán lớp/KTX lại
        if (PRE_DEPARTURE_STAGES.includes(value)) {
          newData.departure_date = "";
          newData.absconded_date = "";
          newData.early_return_date = "";
          newData.early_return_reason = "";
          newData.return_date = "";
        }
      }
      
      return newData;
    });
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

  // Check if trainee_code already exists
  const checkDuplicateCode = async (code: string): Promise<boolean> => {
    // Skip check for edit mode with same code
    if (isEditMode && trainee?.trainee_code === code) {
      return false;
    }
    
    const { data, error } = await supabase
      .from("trainees")
      .select("id, trainee_code")
      .eq("trainee_code", code)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking duplicate code:", error);
      return false;
    }
    
    return !!data;
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Partial<FormData> = {};

    if (!formData.trainee_code.trim()) {
      newErrors.trainee_code = "Bắt buộc";
    } else if (!/^\d{6}$/.test(formData.trainee_code)) {
      newErrors.trainee_code = "Mã phải gồm 6 số";
    } else {
      // Check for duplicate code
      const isDuplicate = await checkDuplicateCode(formData.trainee_code);
      if (isDuplicate) {
        newErrors.trainee_code = "Mã học viên đã tồn tại trong hệ thống";
      }
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
    simple_status: formData.simple_status as any,
    progression_stage: formData.progression_stage as any || null,
    registration_date: formData.registration_date || null,
    height: formData.height ? parseFloat(formData.height) : null,
    vision_left: formData.vision_left ? parseFloat(formData.vision_left) : null,
    vision_right: formData.vision_right ? parseFloat(formData.vision_right) : null,
    dominant_hand: formData.dominant_hand || null,
    hobbies: formData.hobbies.length > 0 ? formData.hobbies.join(", ") : null,
    weight: formData.weight ? parseFloat(formData.weight) : null,
    smoking: formData.smoking || null,
    tattoo: formData.tattoo === "Có",
    tattoo_description: formData.tattoo === "Có" ? (formData.tattoo_description || null) : null,
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
    // Progression stage dates
    interview_pass_date: formData.interview_pass_date || null,
    document_submission_date: formData.document_submission_date || null,
    otit_entry_date: formData.otit_entry_date || null,
    nyukan_entry_date: formData.nyukan_entry_date || null,
    coe_date: formData.coe_date || null,
    departure_date: formData.departure_date || null,
    entry_date: formData.entry_date || null,
    absconded_date: formData.absconded_date || null,
    early_return_date: formData.early_return_date || null,
    early_return_reason: formData.early_return_reason || null,
    return_date: formData.return_date || null,
  });

  const handleSubmit = async () => {
    const isValid = await validateForm();
    if (!isValid) {
      // Check if it's duplicate code error specifically
      if (errors.trainee_code?.includes("đã tồn tại")) {
        toast({
          title: "Mã học viên đã tồn tại",
          description: "Mã học viên này đã được sử dụng. Vui lòng nhập mã khác.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Vui lòng điền đầy đủ các trường bắt buộc",
          variant: "destructive",
        });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      let traineeData = buildTraineeData();
      
      // Upload pending photo if exists (only for new trainees)
      if (!isEditMode && pendingPhotoFile) {
        try {
          const photoUrl = await uploadPhoto(pendingPhotoFile, formData.trainee_code);
          traineeData = { ...traineeData, photo_url: photoUrl };
        } catch (error: any) {
          console.error("Photo upload error:", error);
          toast({
            title: "Lỗi khi tải ảnh",
            description: error.message,
            variant: "destructive",
          });
        }
      }
      
      // Upload pending Line QR if exists (only for new trainees)
      if (!isEditMode && pendingLineQRFile) {
        try {
          const qrUrl = await uploadLineQR(pendingLineQRFile, formData.trainee_code);
          traineeData = { ...traineeData, line_qr_url: qrUrl };
        } catch (error: any) {
          console.error("Line QR upload error:", error);
          toast({
            title: "Lỗi khi tải ảnh QR Line",
            description: error.message,
            variant: "destructive",
          });
        }
      }
      
      // Add project data to trainee
      if (projectData.receiving_company_id) {
        (traineeData as any).receiving_company_id = projectData.receiving_company_id;
      }
      if (projectData.union_id) {
        (traineeData as any).union_id = projectData.union_id;
      }
      if (projectData.job_category_id) {
        (traineeData as any).job_category_id = projectData.job_category_id;
      }
      if (projectData.expected_entry_month) {
        (traineeData as any).expected_entry_month = projectData.expected_entry_month;
      }
      if (projectData.contract_term) {
        (traineeData as any).contract_term = parseFloat(projectData.contract_term);
      }
      // NOTE: interview_pass_date chỉ được cập nhật khi progression_stage = "Đậu phỏng vấn"
      // KHÔNG tự động copy từ interview_date (ngày PV dự kiến)

      const maybeLogInterviewHistory = async (targetTraineeId: string) => {
        const toNull = (v?: string) => (v && v.trim() !== "" ? v : null);

        const payload = {
          interview_date: toNull(projectData.interview_date),
          company_id: toNull(projectData.receiving_company_id),
          union_id: toNull(projectData.union_id),
          job_category_id:
            toNull(projectData.job_category_id) ??
            ((traineeData as any).job_category_id ?? null),
          expected_entry_month: toNull(projectData.expected_entry_month),
        };

        // Chỉ log nếu có ngày phỏng vấn (field bắt buộc để tạo history)
        if (!payload.interview_date) return;

        // Xác định result dựa trên progression_stage
        const currentStage = formData.progression_stage;
        let interviewResult = "Chờ";
        if (currentStage === "Đậu phỏng vấn" || 
            currentStage === "Nộp hồ sơ" || 
            currentStage === "OTIT" || 
            currentStage === "Nyukan" || 
            currentStage === "COE" ||
            currentStage === "Xuất cảnh" ||
            currentStage === "Đang làm việc" ||
            currentStage === "Hoàn thành hợp đồng") {
          interviewResult = "Đậu";
        } else if (currentStage === "Chưa đậu" && traineeData?.progression_stage && traineeData.progression_stage !== "Chưa đậu") {
          // Nếu từ đậu chuyển về chưa đậu = Rớt
          interviewResult = "Rớt";
        }

        // Lấy record mới nhất với cùng interview_date
        const { data: existingRecord, error: existingError } = await supabase
          .from("interview_history")
          .select("id, interview_date, company_id, union_id, job_category_id, expected_entry_month, result")
          .eq("trainee_id", targetTraineeId)
          .eq("interview_date", payload.interview_date)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingError) throw existingError;

        // Nếu đã có record cùng ngày phỏng vấn -> UPDATE thay vì INSERT
        if (existingRecord) {
          const needsUpdate = 
            existingRecord.company_id !== payload.company_id ||
            existingRecord.union_id !== payload.union_id ||
            existingRecord.job_category_id !== payload.job_category_id ||
            existingRecord.expected_entry_month !== payload.expected_entry_month ||
            existingRecord.result !== interviewResult;

          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from("interview_history")
              .update({
                ...payload,
                result: interviewResult,
              })
              .eq("id", existingRecord.id);

            if (updateError) throw updateError;
          }
          return; // Không tạo record mới
        }

        // Tạo record mới nếu không có record cùng ngày
        const { error: insertError } = await supabase.from("interview_history").insert({
          trainee_id: targetTraineeId,
          ...payload,
          result: interviewResult,
        });

        if (insertError) throw insertError;
      };

      let newTraineeId: string | undefined;

      if (isEditMode && traineeId) {
        // Lưu trạng thái cũ trước khi update để kiểm tra chuyển đổi
        const oldStatus = trainee?.simple_status;
        const newStatus = formData.simple_status;
        
        await updateTraineeMutation.mutateAsync({
          id: traineeId,
          updates: traineeData,
        });

        await maybeLogInterviewHistory(traineeId);

        // BUSINESS RULE: Auto-out khỏi KTX và Lớp học khi chuyển từ "Đang học" sang các trạng thái không học
        // Các trạng thái cần auto-out: Bảo lưu, Dừng chương trình, Hủy, Rời công ty, Đang ở Nhật
        const NON_STUDYING_STATUSES = ["Bảo lưu", "Dừng chương trình", "Hủy", "Rời công ty", "Đang ở Nhật", "Không học"];
        
        if (oldStatus === "Đang học" && NON_STUDYING_STATUSES.includes(newStatus)) {
          const today = format(new Date(), "yyyy-MM-dd");
          const reasonText = `Tự động: Chuyển trạng thái sang ${newStatus}`;
          
          // 1. Auto-checkout KTX
          const { data: activeResident } = await supabase
            .from("dormitory_residents")
            .select("id")
            .eq("trainee_id", traineeId)
            .eq("status", "Đang ở")
            .maybeSingle();
          
          if (activeResident) {
            await supabase
              .from("dormitory_residents")
              .update({
                status: "Đã rời",
                check_out_date: today,
                transfer_reason: reasonText,
              })
              .eq("id", activeResident.id);
          }
          
          // 2. Auto-out khỏi lớp học và lưu enrollment_history
          const oldClassId = trainee?.class_id;
          if (oldClassId) {
            // Lưu enrollment_history trước khi xóa class_id
            await supabase
              .from("enrollment_history")
              .insert({
                trainee_id: traineeId,
                action_type: "Rời lớp",
                class_id: oldClassId,
                action_date: today,
                notes: reasonText,
              });
            
            // Xóa class_id
            await supabase
              .from("trainees")
              .update({ class_id: null })
              .eq("id", traineeId);
          }
        }

        toast({ title: "Cập nhật học viên thành công" });
      } else {
        const { data, error } = await supabase
          .from("trainees")
          .insert(traineeData)
          .select("id")
          .single();
        if (error) throw error;
        newTraineeId = data.id;
        toast({ title: "Thêm học viên thành công" });
      }

      // Save history data for both new and edit mode
      const targetTraineeId = isEditMode ? traineeId : newTraineeId;
      
      if (targetTraineeId) {
        // For edit mode: delete existing then insert new
        // For new mode: just insert
        
        // Save education history
        if (isEditMode) {
          await supabase.from("education_history").delete().eq("trainee_id", targetTraineeId);
        }
        if (educationItems.length > 0) {
          const eduData = educationItems
            .filter(item => item.school_name)
            .map(item => ({
              trainee_id: targetTraineeId,
              school_name: item.school_name,
              level: item.level || null,
              major: item.major || null,
              start_year: item.start_year ? parseInt(item.start_year) : null,
              end_year: item.end_year ? parseInt(item.end_year) : null,
            }));
          if (eduData.length > 0) {
            await supabase.from("education_history").insert(eduData);
          }
        }
        
        // Save work history
        if (isEditMode) {
          await supabase.from("work_history").delete().eq("trainee_id", targetTraineeId);
        }
        if (workItems.length > 0) {
          const workData = workItems
            .filter(item => item.company_name)
            .map(item => ({
              trainee_id: targetTraineeId,
              company_name: item.company_name,
              position: item.position || null,
              start_date: item.start_date || null,
              end_date: item.end_date || null,
            }));
          if (workData.length > 0) {
            await supabase.from("work_history").insert(workData);
          }
        }
        
        // Save family members
        if (isEditMode) {
          await supabase.from("family_members").delete().eq("trainee_id", targetTraineeId);
        }
        if (familyItems.length > 0) {
          const familyData = familyItems
            .filter(item => item.full_name)
            .map(item => ({
              trainee_id: targetTraineeId,
              relationship: item.relationship || "Khác",
              full_name: item.full_name,
              gender: item.gender || null,
              birth_year: item.birth_year ? parseInt(item.birth_year) : null,
              location: item.living_status || null,
              occupation: item.occupation || null,
              income: item.income || null,
            }));
          if (familyData.length > 0) {
            await supabase.from("family_members").insert(familyData);
          }
        }
        
        // Save japan relatives
        if (isEditMode) {
          await supabase.from("japan_relatives").delete().eq("trainee_id", targetTraineeId);
        }
        if (japanRelativeItems.length > 0) {
          const japanData = japanRelativeItems
            .filter(item => item.full_name)
            .map(item => ({
              trainee_id: targetTraineeId,
              full_name: item.full_name,
              relationship: item.relationship || null,
              age: item.age ? parseInt(item.age) : null,
              gender: item.gender || null,
              address_japan: item.address_japan || null,
              residence_status: item.residence_status || null,
            }));
          if (japanData.length > 0) {
            await supabase.from("japan_relatives").insert(japanData);
          }
        }
        
        // Save interview history if there's interview data (only for new trainees)
        if (!isEditMode) {
          await maybeLogInterviewHistory(targetTraineeId);
        }
      }

      // Invalidate queries to ensure fresh data on next load
      await queryClient.invalidateQueries({ queryKey: ["education-history"] });
      await queryClient.invalidateQueries({ queryKey: ["work-history"] });
      await queryClient.invalidateQueries({ queryKey: ["family-members"] });
      await queryClient.invalidateQueries({ queryKey: ["japan-relatives"] });
      await queryClient.invalidateQueries({ queryKey: ["interview-history"] });
      await queryClient.invalidateQueries({ queryKey: ["trainee"] });

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
                        onPhotoChange={(url, file) => {
                          if (file && !isEditMode) {
                            setPendingPhotoFile(file);
                          } else if (url === null && file === null) {
                            setPendingPhotoFile(null);
                            updateField("photo_url", "");
                          } else {
                            updateField("photo_url", url || "");
                          }
                        }}
                        traineeCode={formData.trainee_code}
                        previewOnly={!isEditMode}
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
                          className={cn("w-24", getInputClass(formData.trainee_code, errors.trainee_code || (isCodeDuplicate ? "error" : undefined)))}
                        />
                        {isCheckingCode && (
                          <span className="text-xs text-muted-foreground">Đang kiểm tra...</span>
                        )}
                        {isCodeDuplicate && !isCheckingCode && (
                          <span className="text-xs text-destructive">{getDuplicateErrorMessage('trainees', 'trainee_code')}</span>
                        )}
                        {errors.trainee_code && !isCodeDuplicate && (
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

                  {/* Third Row - Documents (sensitive fields) */}
                  <div className="grid grid-cols-6 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Số CCCD/CMND
                        {!canEditSensitiveFields && isEditMode && <span className="text-xs text-orange-500 ml-1">(bảo mật)</span>}
                      </Label>
                      <Input
                        placeholder="001234567890"
                        value={!canEditSensitiveFields && isEditMode && formData.cccd_number 
                          ? formData.cccd_number.replace(/(.{3})(.*)(.{3})/, "$1****$3")
                          : formData.cccd_number}
                        onChange={(e) => updateField("cccd_number", e.target.value)}
                        className={getInputClass(formData.cccd_number)}
                        disabled={!canEditSensitiveFields && isEditMode}
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
                      <Label className="text-xs text-muted-foreground">Nơi cấp CCCD</Label>
                      <SearchableSelect
                        options={cccdPlaces.length > 0 ? cccdPlaces : ["Cục Cảnh sát QLHC về TTXH"]}
                        value={formData.cccd_place}
                        onValueChange={(v) => updateField("cccd_place", v)}
                        placeholder="Chọn nơi cấp"
                        searchPlaceholder="Tìm nơi cấp..."
                        emptyText="Không tìm thấy."
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Số hộ chiếu
                        {!canEditSensitiveFields && isEditMode && <span className="text-xs text-orange-500 ml-1">(bảo mật)</span>}
                      </Label>
                      <Input
                        placeholder="B1234567"
                        value={!canEditSensitiveFields && isEditMode && formData.passport_number
                          ? formData.passport_number.replace(/(.{2})(.*)(.{2})/, "$1***$3")
                          : formData.passport_number}
                        onChange={(e) => updateField("passport_number", e.target.value)}
                        className={getInputClass(formData.passport_number)}
                        disabled={!canEditSensitiveFields && isEditMode}
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
                    <div>
                      <Label className="text-xs text-muted-foreground">Nơi cấp HC</Label>
                      <SearchableSelect
                        options={passportPlaces.length > 0 ? passportPlaces : ["Cục Quản lý Xuất nhập cảnh"]}
                        value={formData.passport_place}
                        onValueChange={(v) => updateField("passport_place", v)}
                        placeholder="Chọn nơi cấp"
                        searchPlaceholder="Tìm nơi cấp..."
                        emptyText="Không tìm thấy."
                      />
                    </div>
                  </div>

                  {/* Fourth Row */}
                  <div className="grid grid-cols-6 gap-3">
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
                      <Label className="text-xs text-muted-foreground">Tôn giáo</Label>
                      <SearchableSelect
                        options={religions.length > 0 ? religions : ["Không"]}
                        value={formData.religion}
                        onValueChange={(v) => updateField("religion", v)}
                        placeholder="Chọn tôn giáo"
                        searchPlaceholder="Tìm tôn giáo..."
                        emptyText="Không tìm thấy."
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Diện chính sách</Label>
                      <SearchableSelect
                        options={policyCategories.length > 0 ? policyCategories : ["Không có"]}
                        value={formData.policy_category}
                        onValueChange={(v) => updateField("policy_category", v)}
                        placeholder="Chọn diện"
                        searchPlaceholder="Tìm diện..."
                        emptyText="Không tìm thấy."
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Số điện thoại
                        {!canEditSensitiveFields && isEditMode && <span className="text-xs text-orange-500 ml-1">(bảo mật)</span>}
                      </Label>
                      <Input
                        placeholder="0901234567"
                        value={!canEditSensitiveFields && isEditMode && formData.phone
                          ? formData.phone.replace(/(.{4})(.*)(.{3})/, "$1***$3")
                          : formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className={getInputClass(formData.phone)}
                        disabled={!canEditSensitiveFields && isEditMode}
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
                      <Label className="text-xs text-muted-foreground">Địa chỉ hiện tại</Label>
                      <Input
                        placeholder="Địa chỉ hiện tại của học viên"
                        value={formData.current_address}
                        onChange={(e) => handleAddressChange("current_address", e.target.value)}
                        className={getInputClass(formData.current_address)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Email / Zalo
                        {!canEditSensitiveFields && isEditMode && formData.email && <span className="text-xs text-orange-500 ml-1">(bảo mật)</span>}
                      </Label>
                      <Input
                        placeholder="email@example.com"
                        value={!canEditSensitiveFields && isEditMode && formData.email
                          ? formData.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
                          : formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className={getInputClass(formData.email)}
                        disabled={!canEditSensitiveFields && isEditMode && !!formData.email}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Địa chỉ thường trú (trước sáp nhập)</Label>
                      <Input
                        placeholder="Địa chỉ thường trú cũ"
                        value={formData.permanent_address}
                        onChange={(e) => handleAddressChange("permanent_address", e.target.value)}
                        className={getInputClass(formData.permanent_address)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Địa chỉ thường trú (sau sáp nhập)</Label>
                      <Input
                        placeholder="Địa chỉ thường trú mới"
                        value={formData.permanent_address_new}
                        onChange={(e) => handleAddressChange("permanent_address_new", e.target.value)}
                        className={getInputClass(formData.permanent_address_new)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
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
                  {/* SĐT Phụ huynh với dropdown quan hệ */}
                  <div className="grid grid-cols-6 gap-3">
                    {/* SĐT Phụ huynh 1 */}
                    <div className="col-span-2 flex gap-2">
                      <div className="w-24 flex-shrink-0">
                        <Label className="text-xs text-muted-foreground">Quan hệ 1</Label>
                        <Select
                          value={formData.parent_phone_1_relation}
                          onValueChange={(v) => updateField("parent_phone_1_relation", v)}
                        >
                          <SelectTrigger className={getSelectClass(formData.parent_phone_1_relation)}>
                            <SelectValue placeholder="Chọn" />
                          </SelectTrigger>
                          <SelectContent>
                            {PARENT_RELATIONS.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">
                          SĐT Phụ huynh 1
                          {!canEditSensitiveFields && isEditMode && formData.parent_phone_1 && <span className="text-xs text-orange-500 ml-1">(bảo mật)</span>}
                        </Label>
                        <Input
                          placeholder="0901234567"
                          value={!canEditSensitiveFields && isEditMode && formData.parent_phone_1
                            ? formData.parent_phone_1.replace(/(.{4})(.*)(.{3})/, "$1***$3")
                            : formData.parent_phone_1}
                          onChange={(e) => updateField("parent_phone_1", e.target.value)}
                          className={getInputClass(formData.parent_phone_1)}
                          disabled={!canEditSensitiveFields && isEditMode && !!formData.parent_phone_1}
                        />
                      </div>
                    </div>
                    
                    {/* SĐT Phụ huynh 2 */}
                    <div className="col-span-2 flex gap-2">
                      <div className="w-24 flex-shrink-0">
                        <Label className="text-xs text-muted-foreground">Quan hệ 2</Label>
                        <Select
                          value={formData.parent_phone_2_relation}
                          onValueChange={(v) => updateField("parent_phone_2_relation", v)}
                        >
                          <SelectTrigger className={getSelectClass(formData.parent_phone_2_relation)}>
                            <SelectValue placeholder="Chọn" />
                          </SelectTrigger>
                          <SelectContent>
                            {PARENT_RELATIONS.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">
                          SĐT Phụ huynh 2
                          {!canEditSensitiveFields && isEditMode && formData.parent_phone_2 && <span className="text-xs text-orange-500 ml-1">(bảo mật)</span>}
                        </Label>
                        <Input
                          placeholder="0901234567"
                          value={!canEditSensitiveFields && isEditMode && formData.parent_phone_2
                            ? formData.parent_phone_2.replace(/(.{4})(.*)(.{3})/, "$1***$3")
                            : formData.parent_phone_2}
                          onChange={(e) => updateField("parent_phone_2", e.target.value)}
                          className={getInputClass(formData.parent_phone_2)}
                          disabled={!canEditSensitiveFields && isEditMode && !!formData.parent_phone_2}
                        />
                      </div>
                    </div>
                    
                    {/* SĐT Phụ huynh 3 */}
                    <div className="col-span-2 flex gap-2">
                      <div className="w-24 flex-shrink-0">
                        <Label className="text-xs text-muted-foreground">Quan hệ 3</Label>
                        <Select
                          value={formData.parent_phone_3_relation}
                          onValueChange={(v) => updateField("parent_phone_3_relation", v)}
                        >
                          <SelectTrigger className={getSelectClass(formData.parent_phone_3_relation)}>
                            <SelectValue placeholder="Chọn" />
                          </SelectTrigger>
                          <SelectContent>
                            {PARENT_RELATIONS.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">
                          SĐT Phụ huynh 3
                          {!canEditSensitiveFields && isEditMode && formData.parent_phone_3 && <span className="text-xs text-orange-500 ml-1">(bảo mật)</span>}
                        </Label>
                        <Input
                          placeholder="0901234567"
                          value={!canEditSensitiveFields && isEditMode && formData.parent_phone_3
                            ? formData.parent_phone_3.replace(/(.{4})(.*)(.{3})/, "$1***$3")
                            : formData.parent_phone_3}
                          onChange={(e) => updateField("parent_phone_3", e.target.value)}
                          className={getInputClass(formData.parent_phone_3)}
                          disabled={!canEditSensitiveFields && isEditMode && !!formData.parent_phone_3}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Line QR riêng một dòng */}
                  <div className="grid grid-cols-6 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Line QR</Label>
                      <div className="mt-1">
                        <LineQRUpload
                          currentQRUrl={formData.line_qr_url}
                          onQRChange={(url, file) => {
                            if (file && !isEditMode) {
                              setPendingLineQRFile(file);
                            } else if (url === null && file === null) {
                              setPendingLineQRFile(null);
                              updateField("line_qr_url", "");
                            } else {
                              updateField("line_qr_url", url || "");
                            }
                          }}
                          traineeCode={formData.trainee_code}
                          previewOnly={!isEditMode}
                        />
                      </div>
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
                      <MultiSelect
                        options={hobbiesOptions.length > 0 ? hobbiesOptions : []}
                        value={formData.hobbies}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, hobbies: v }))}
                        placeholder="Chọn sở thích..."
                        searchPlaceholder="Tìm sở thích..."
                        emptyText="Không tìm thấy."
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
                        onValueChange={(v) => {
                          updateField("tattoo", v);
                          if (v === "Không") {
                            updateField("tattoo_description", "");
                          }
                        }}
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
                    {formData.tattoo === "Có" && (
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Mô tả hình xăm (vị trí, kích thước)</Label>
                        <Input
                          placeholder="VD: Lưng, 10x15cm, hình rồng"
                          value={formData.tattoo_description}
                          onChange={(e) => updateField("tattoo_description", e.target.value)}
                          className={getInputClass(formData.tattoo_description)}
                        />
                      </div>
                    )}
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
                    <div>
                      <Label className="text-xs text-muted-foreground">Thính lực</Label>
                      <Input
                        placeholder="Bình thường"
                        value={formData.hearing}
                        onChange={(e) => updateField("hearing", e.target.value)}
                        className={getInputClass(formData.hearing)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Viêm gan B</Label>
                      <Select
                        value={formData.hepatitis_b}
                        onValueChange={(v) => updateField("hepatitis_b", v)}
                      >
                        <SelectTrigger className={getSelectClass(formData.hepatitis_b)}>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Âm tính">Âm tính</SelectItem>
                          <SelectItem value="Dương tính">Dương tính</SelectItem>
                          <SelectItem value="Chưa xét nghiệm">Chưa xét nghiệm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Measurements - Số đo */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Size quần</Label>
                      <Input
                        placeholder="VD: 28, M, L..."
                        value={formData.pants_size}
                        onChange={(e) => updateField("pants_size", e.target.value)}
                        className={getInputClass(formData.pants_size)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Size áo</Label>
                      <Input
                        placeholder="VD: S, M, L, XL..."
                        value={formData.shirt_size}
                        onChange={(e) => updateField("shirt_size", e.target.value)}
                        className={getInputClass(formData.shirt_size)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Size giày</Label>
                      <Input
                        placeholder="VD: 40, 41, 42..."
                        value={formData.shoe_size}
                        onChange={(e) => updateField("shoe_size", e.target.value)}
                        className={getInputClass(formData.shoe_size)}
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
                  {/* simple_status: Editable */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Trạng thái</Label>
                    <Select
                      value={formData.simple_status}
                      onValueChange={(value) => updateField("simple_status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIMPLE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* progression_stage: Editable */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Giai đoạn</Label>
                    <Select
                      value={formData.progression_stage}
                      onValueChange={(value) => updateField("progression_stage", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giai đoạn" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRESSION_STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {PROGRESSION_STAGE_LABELS[stage] || stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date fields - luôn hiển thị để nhập liệu */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Ngày nhập học</Label>
                    <Input
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => updateField("entry_date", e.target.value)}
                    />
                  </div>

                  {/* Date fields - hiển thị tất cả để nhập liệu khi cần */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Ngày nộp HS</Label>
                    <Input
                      type="date"
                      value={formData.document_submission_date}
                      onChange={(e) => updateField("document_submission_date", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Ngày vào OTIT</Label>
                    <Input
                      type="date"
                      value={formData.otit_entry_date}
                      onChange={(e) => updateField("otit_entry_date", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Ngày vào Nyukan</Label>
                    <Input
                      type="date"
                      value={formData.nyukan_entry_date}
                      onChange={(e) => updateField("nyukan_entry_date", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Ngày có COE</Label>
                    <Input
                      type="date"
                      value={formData.coe_date}
                      onChange={(e) => updateField("coe_date", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Ngày xuất cảnh</Label>
                    <Input
                      type="date"
                      value={formData.departure_date}
                      onChange={(e) => updateField("departure_date", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Ngày bỏ trốn</Label>
                    <Input
                      type="date"
                      value={formData.absconded_date}
                      onChange={(e) => updateField("absconded_date", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Ngày hoàn thành HĐ</Label>
                    <Input
                      type="date"
                      value={formData.return_date}
                      onChange={(e) => updateField("return_date", e.target.value)}
                    />
                  </div>

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

        <TabsContent value="history" className="mt-4 space-y-4">
          <EducationHistoryForm items={educationItems} onChange={setEducationItems} />
          <WorkHistoryForm items={workItems} onChange={setWorkItems} />
          <FamilyMembersForm items={familyItems} onChange={setFamilyItems} />
          <JapanRelativesForm items={japanRelativeItems} onChange={setJapanRelativeItems} />
        </TabsContent>

        <TabsContent value="project" className="mt-4">
          <ProjectInterviewForm data={projectData} onChange={setProjectData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
