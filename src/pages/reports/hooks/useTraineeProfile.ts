import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  class_id: string;
  class_name: string | null;
}

export interface TestScoreRecord {
  id: string;
  test_name: string;
  test_date: string;
  score: number | null;
  max_score: number;
  notes: string | null;
  evaluation: string | null;
  class_id: string;
  class_name: string | null;
}

export interface EducationHistoryRecord {
  id: string;
  school_name: string;
  level: string | null;
  major: string | null;
  start_month: number | null;
  start_year: number | null;
  end_month: number | null;
  end_year: number | null;
}

export interface WorkHistoryRecord {
  id: string;
  company_name: string;
  position: string | null;
  start_date: string | null;
  end_date: string | null;
  responsibilities: string | null;
}

export interface FamilyMemberRecord {
  id: string;
  full_name: string;
  relationship: string;
  birth_year: number | null;
  gender: string | null;
  occupation: string | null;
  location: string | null;
  income: string | null;
}

export interface JapanRelativeRecord {
  id: string;
  full_name: string;
  relationship: string | null;
  age: number | null;
  gender: string | null;
  address_japan: string | null;
  residence_status: string | null;
}

export interface DormitoryHistoryRecord {
  id: string;
  dormitory_name: string | null;
  dormitory_address: string | null;
  room_number: string | null;
  bed_number: string | null;
  check_in_date: string;
  check_out_date: string | null;
  status: string | null;
  notes: string | null;
  transfer_reason: string | null;
  from_dormitory_name: string | null;
}

export interface EnrollmentHistoryRecord {
  id: string;
  action_type: string;
  action_date: string;
  notes: string | null;
  from_class: string | null;
  to_class: string | null;
  class_id: string | null;
}

export interface WorkflowHistoryRecord {
  id: string;
  from_stage: string | null;
  to_stage: string;
  sub_status: string | null;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
  department_name: string | null;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  table_name: string;
  description: string;
  created_at: string;
}

export interface InterviewHistoryRecord {
  id: string;
  interview_date: string;
  result: string | null;
  notes: string | null;
  expected_entry_month: string | null;
  company_id: string | null;
  company_name: string | null;
  company_name_japanese: string | null;
  union_id: string | null;
  union_name: string | null;
  union_name_japanese: string | null;
  job_category_id: string | null;
  job_name: string | null;
  job_name_japanese: string | null;
}

export interface TraineeProfile {
  id: string;
  trainee_code: string;
  full_name: string;
  furigana: string | null;
  birth_date: string | null;
  gender: string | null;
  trainee_type: string | null;
  source: string | null;
  photo_url: string | null;
  
  // PII fields (may be masked)
  phone: string | null;
  zalo: string | null;
  email: string | null;
  facebook: string | null;
  parent_phone_1: string | null;
  parent_phone_2: string | null;
  cccd_number: string | null;
  cccd_date: string | null;
  cccd_place: string | null;
  passport_number: string | null;
  passport_date: string | null;
  
  // Addresses
  permanent_address: string | null;
  current_address: string | null;
  temp_address: string | null;
  household_address: string | null;
  birthplace: string | null;
  
  // Personal details
  ethnicity: string | null;
  religion: string | null;
  marital_status: string | null;
  education_level: string | null;
  policy_category: string | null;
  
  // Physical attributes
  height: number | null;
  weight: number | null;
  blood_group: string | null;
  vision_left: number | null;
  vision_right: number | null;
  dominant_hand: string | null;
  
  // Lifestyle
  smoking: string | null;
  drinking: string | null;
  tattoo: boolean | null;
  tattoo_description: string | null;
  health_status: string | null;
  hobbies: string | null;
  
  // Timeline dates
  entry_date: string | null;
  registration_date: string | null;
  interview_pass_date: string | null;
  interview_count: number | null;
  document_submission_date: string | null;
  otit_entry_date: string | null;
  nyukan_entry_date: string | null;
  coe_date: string | null;
  visa_date: string | null;
  departure_date: string | null;
  return_date: string | null;
  expected_return_date: string | null;
  expected_entry_month: string | null;
  contract_term: number | null;
  contract_end_date: string | null;
  absconded_date: string | null;
  early_return_date: string | null;
  early_return_reason: string | null;
  
  // Status
  progression_stage: string | null;
  simple_status: string | null;
  enrollment_status: string | null;
  notes: string | null;
  
  // Related data
  workflow: {
    current_stage?: string;
    sub_status?: string;
    transitioned_at?: string;
  };
  company: {
    id?: string;
    code?: string;
    name?: string;
    name_japanese?: string;
  };
  union: {
    id?: string;
    code?: string;
    name?: string;
    name_japanese?: string;
  };
  job_category: {
    id?: string;
    code?: string;
    name?: string;
    name_japanese?: string;
  };
  class: {
    id?: string;
    code?: string;
    name?: string;
    level?: string;
    status?: string;
  };
  interview_history: InterviewHistoryRecord[];
  trainee_notes: Array<{
    id: string;
    note_type: string;
    content: string;
    created_at: string;
  }>;
  violations: Array<{
    id: string;
    violation_type: string;
    description: string;
    violation_date: string;
    status: string;
  }>;
  reviews: Array<{
    id: string;
    review_type: string;
    content: string;
    rating: number | null;
    is_blacklisted: boolean;
    blacklist_reason: string | null;
    created_at: string;
  }>;
  attendance: AttendanceRecord[];
  test_scores: TestScoreRecord[];
  education_history: EducationHistoryRecord[];
  work_history: WorkHistoryRecord[];
  family_members: FamilyMemberRecord[];
  japan_relatives: JapanRelativeRecord[];
  dormitory_history: DormitoryHistoryRecord[];
  enrollment_history: EnrollmentHistoryRecord[];
  workflow_history: WorkflowHistoryRecord[];
  audit_logs: AuditLogRecord[];
  
  can_view_pii: boolean;
  error?: string;
}

export function useTraineeProfile() {
  const [profile, setProfile] = useState<TraineeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTrainee = async (traineeCode: string) => {
    if (!traineeCode.trim()) {
      toast.error("Vui lòng nhập mã học viên");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProfile(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("get_trainee_full_profile", {
        p_trainee_code: traineeCode.trim(),
      });

      if (rpcError) {
        console.error("RPC error:", rpcError);
        setError(rpcError.message);
        toast.error("Lỗi tra cứu: " + rpcError.message);
        return;
      }

      const result = data as unknown as TraineeProfile | { error: string };

      if ("error" in result && result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setProfile(result as TraineeProfile);
      toast.success(`Đã tìm thấy hồ sơ: ${(result as TraineeProfile).full_name}`);
    } catch (err) {
      console.error("Search error:", err);
      setError("Lỗi không xác định khi tra cứu");
      toast.error("Lỗi không xác định khi tra cứu");
    } finally {
      setIsLoading(false);
    }
  };

  const clearProfile = () => {
    setProfile(null);
    setError(null);
  };

  return {
    profile,
    isLoading,
    error,
    searchTrainee,
    clearProfile,
  };
}
