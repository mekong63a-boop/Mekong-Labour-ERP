import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";

type WorkflowStage = Database["public"]["Enums"]["trainee_workflow_stage"];

interface TransitionParams {
  traineeId: string;
  toStage: WorkflowStage;
  subStatus?: string | null;
  reason?: string | null;
}

interface TransitionResult {
  success: boolean;
  trainee_id: string;
  from_stage: WorkflowStage | null;
  to_stage: WorkflowStage;
  sub_status: string | null;
}

/**
 * Hook to transition trainee through workflow stages
 * Uses the single RPC: rpc_transition_trainee_stage
 * This is the ONLY way to change trainee status in the system
 */
export function useTraineeTransition() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ traineeId, toStage, subStatus, reason }: TransitionParams): Promise<TransitionResult> => {
      const { data, error } = await supabase.rpc("rpc_transition_trainee_stage", {
        p_trainee_id: traineeId,
        p_to_stage: toStage,
        p_sub_status: subStatus ?? null,
        p_reason: reason ?? null,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Parse the JSON response
      const result = data as unknown as TransitionResult;
      return result;
    },
    onSuccess: (result) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["trainee", result.trainee_id] });
      queryClient.invalidateQueries({ queryKey: ["trainee-workflow"] });
      queryClient.invalidateQueries({ queryKey: ["trainee-workflow-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast({
        title: "Chuyển trạng thái thành công",
        description: `Đã chuyển sang: ${getStageLabel(result.to_stage)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi chuyển trạng thái",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Get display label for workflow stage
 * Based on actual ENUM values in database:
 * recruited, trained, dormitory, visa_processing, ready_to_depart, departed, post_departure, archived
 */
export function getStageLabel(stage: WorkflowStage): string {
  const labels: Record<WorkflowStage, string> = {
    recruited: "Đã tuyển",
    trained: "Đã đào tạo",
    dormitory: "Ở KTX",
    visa_processing: "Đang xử lý Visa",
    ready_to_depart: "Sẵn sàng xuất cảnh",
    departed: "Đã xuất cảnh",
    post_departure: "Sau xuất cảnh",
    archived: "Lưu trữ",
  };
  return labels[stage] || stage;
}

/**
 * Get all available workflow stages
 */
export function getWorkflowStages(): { value: WorkflowStage; label: string }[] {
  return [
    { value: "recruited", label: "Đã tuyển" },
    { value: "trained", label: "Đã đào tạo" },
    { value: "dormitory", label: "Ở KTX" },
    { value: "visa_processing", label: "Đang xử lý Visa" },
    { value: "ready_to_depart", label: "Sẵn sàng xuất cảnh" },
    { value: "departed", label: "Đã xuất cảnh" },
    { value: "post_departure", label: "Sau xuất cảnh" },
    { value: "archived", label: "Lưu trữ" },
  ];
}

/**
 * Map old progression_stage to new workflow stage
 */
export function mapProgressionToWorkflow(progressionStage: string): WorkflowStage {
  const mapping: Record<string, WorkflowStage> = {
    "Chưa đậu": "recruited",
    "Đậu phỏng vấn": "trained",
    "Nộp hồ sơ": "visa_processing",
    "OTIT": "visa_processing",
    "Nyukan": "visa_processing",
    "COE": "ready_to_depart",
    "Xuất cảnh": "departed",
    "Đang làm việc": "post_departure",
    "Hoàn thành hợp đồng": "archived",
    "Bỏ trốn": "archived",
    "Về trước hạn": "archived",
  };
  return mapping[progressionStage] || "recruited";
}
