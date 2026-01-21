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
  parent_phone_1: string | null;
  parent_phone_2: string | null;
  cccd_number: string | null;
  cccd_date: string | null;
  passport_number: string | null;
  passport_date: string | null;
  
  // Addresses
  permanent_address: string | null;
  current_address: string | null;
  birthplace: string | null;
  
  // Timeline dates
  entry_date: string | null;
  interview_pass_date: string | null;
  document_submission_date: string | null;
  otit_entry_date: string | null;
  nyukan_entry_date: string | null;
  coe_date: string | null;
  visa_date: string | null;
  departure_date: string | null;
  return_date: string | null;
  expected_return_date: string | null;
  
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
  };
  interview_history: Array<{
    interview_date: string;
    result: string;
    notes: string | null;
    company_id: string;
  }>;
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
