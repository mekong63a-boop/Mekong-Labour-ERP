import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type InterviewHistory = Tables<"interview_history">;
export type EducationHistory = Tables<"education_history">;
export type WorkHistory = Tables<"work_history">;
export type FamilyMember = Tables<"family_members">;
export type JapanRelative = Tables<"japan_relatives">;

// Interview History - explicitly specify FK names to avoid PostgREST PGRST201 ambiguity
export function useInterviewHistory(traineeId: string | undefined) {
  return useQuery({
    queryKey: ["interview-history", traineeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_history")
        .select(`
          *,
          companies:companies!fk_interview_company(id, name, name_japanese),
          unions:unions!fk_interview_union(id, name, name_japanese),
          job_categories:job_categories!fk_interview_job_category(id, name, name_japanese)
        `)
        .eq("trainee_id", traineeId!)
        .order("interview_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!traineeId,
  });
}

// Education History
export function useEducationHistory(traineeId: string) {
  return useQuery({
    queryKey: ["education-history", traineeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_history")
        .select("*")
        .eq("trainee_id", traineeId)
        .order("start_year", { ascending: false });
      if (error) throw error;
      return data as EducationHistory[];
    },
    enabled: !!traineeId,
  });
}

// Work History
export function useWorkHistory(traineeId: string) {
  return useQuery({
    queryKey: ["work-history", traineeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_history")
        .select("*")
        .eq("trainee_id", traineeId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as WorkHistory[];
    },
    enabled: !!traineeId,
  });
}

// Family Members
export function useFamilyMembers(traineeId: string) {
  return useQuery({
    queryKey: ["family-members", traineeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("trainee_id", traineeId)
        .order("created_at");
      if (error) throw error;
      return data as FamilyMember[];
    },
    enabled: !!traineeId,
  });
}

// Japan Relatives
export function useJapanRelatives(traineeId: string) {
  return useQuery({
    queryKey: ["japan-relatives", traineeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("japan_relatives")
        .select("*")
        .eq("trainee_id", traineeId)
        .order("created_at");
      if (error) throw error;
      return data as JapanRelative[];
    },
    enabled: !!traineeId,
  });
}
