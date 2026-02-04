import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Types matching the database state machine
export interface StageTransition {
  to_stage: string;
  stage_name: string;
  stage_name_jp: string;
  condition: string | null;
  requires_fields: string[] | null;
  ui_color: string;
}

export interface StageTimelineEntry {
  id: string;
  from_stage: string | null;
  to_stage: string;
  from_name: string | null;
  to_name: string;
  sub_status: string | null;
  reason: string | null;
  changed_at: string;
  changed_by: string | null;
}

export interface CurrentStageInfo {
  current_stage: string;
  stage_name: string;
  stage_name_jp: string;
  sub_status: string | null;
  ui_color: string;
  transitioned_at: string | null;
}

export interface TransitionResult {
  success: boolean;
  error?: string;
  from_stage?: string;
  to_stage?: string;
  sub_status?: string;
  message?: string;
  missing_fields?: string[];
}

// Hook to get allowed transitions for a trainee
export function useAllowedTransitions(traineeId: string | undefined) {
  return useQuery({
    queryKey: ["allowed-transitions", traineeId],
    queryFn: async () => {
      if (!traineeId) return null;
      
      const { data, error } = await supabase
        .rpc("rpc_get_allowed_transitions", { p_trainee_id: traineeId });
      
      if (error) throw error;
      
      return data as unknown as {
        current_stage: string | null;
        transitions: StageTransition[];
      };
    },
    enabled: !!traineeId,
    staleTime: 30000, // 30 seconds
  });
}

// Hook to get stage timeline for a trainee
export function useStageTimeline(traineeId: string | undefined) {
  return useQuery({
    queryKey: ["stage-timeline", traineeId],
    queryFn: async () => {
      if (!traineeId) return null;
      
      const { data, error } = await supabase
        .rpc("rpc_get_stage_timeline", { p_trainee_id: traineeId });
      
      if (error) throw error;
      
      return data as unknown as {
        current: CurrentStageInfo | null;
        history: StageTimelineEntry[];
      };
    },
    enabled: !!traineeId,
    staleTime: 30000,
  });
}

// Hook to transition trainee stage (main action)
export function useTransitionStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      traineeId,
      toStage,
      subStatus,
      reason,
    }: {
      traineeId: string;
      toStage: string;
      subStatus?: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase.rpc("rpc_transition_trainee_stage", {
        p_trainee_id: traineeId,
        p_to_stage: toStage,
        p_sub_status: subStatus || null,
        p_reason: reason || null,
      });
      
      if (error) throw error;
      
      const result = data as unknown as TransitionResult;
      
      if (!result.success) {
        throw new Error(result.error || "Không thể chuyển trạng thái");
      }
      
      return result;
    },
    onSuccess: (result, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["allowed-transitions", variables.traineeId] });
      queryClient.invalidateQueries({ queryKey: ["stage-timeline", variables.traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainee", variables.traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["dormitory-residents"] });
      
      toast.success(result.message || "Đã chuyển trạng thái thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook to get all master stages (for display)
export function useMasterStages() {
  return useQuery({
    queryKey: ["master-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("master_trainee_stages")
        .select("*")
        .order("order_index");
      
      if (error) throw error;
      return data;
    },
    staleTime: Infinity, // Master data rarely changes
  });
}

// Hook to get terminated reasons
export function useTerminatedReasons() {
  return useQuery({
    queryKey: ["terminated-reasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("master_terminated_reasons")
        .select("*");
      
      if (error) throw error;
      return data;
    },
    staleTime: Infinity,
  });
}
