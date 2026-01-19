import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Workflow stage types matching the database ENUM
export type WorkflowStage = 
  | 'recruited'
  | 'trained'
  | 'dormitory'
  | 'visa_processing'
  | 'ready_to_depart'
  | 'departed'
  | 'post_departure'
  | 'archived';

export interface WorkflowStageCounts {
  all: number;
  recruited: number;
  trained: number;
  dormitory: number;
  visa_processing: number;
  ready_to_depart: number;
  departed: number;
  post_departure: number;
  archived: number;
}

// Stage labels in Vietnamese
export const WORKFLOW_STAGE_LABELS: Record<WorkflowStage, string> = {
  recruited: 'Mới tuyển dụng',
  trained: 'Đang đào tạo',
  dormitory: 'Chờ xuất cảnh',
  visa_processing: 'Đang xử lý visa',
  ready_to_depart: 'Sẵn sàng xuất cảnh',
  departed: 'Đã xuất cảnh',
  post_departure: 'Đang ở Nhật',
  archived: 'Lưu trữ',
};

// All workflow stages in order
export const WORKFLOW_STAGES: WorkflowStage[] = [
  'recruited',
  'trained',
  'dormitory',
  'visa_processing',
  'ready_to_depart',
  'departed',
  'post_departure',
  'archived',
];

/**
 * Hook to fetch trainee counts by workflow stage
 * Uses trainee_workflow.current_stage as the SINGLE SOURCE OF TRUTH
 */
export function useWorkflowStageCounts() {
  return useQuery({
    queryKey: ['workflow-stage-counts'],
    queryFn: async () => {
      const startTime = performance.now();

      // Fetch from the new view
      const { data, error } = await supabase
        .from('trainee_workflow_counts')
        .select('stage_key, stage_label, count');

      if (error) throw error;

      // Build counts object
      const counts: WorkflowStageCounts = {
        all: 0,
        recruited: 0,
        trained: 0,
        dormitory: 0,
        visa_processing: 0,
        ready_to_depart: 0,
        departed: 0,
        post_departure: 0,
        archived: 0,
      };

      (data || []).forEach((row: { stage_key: string; count: number }) => {
        if (row.stage_key === 'all') {
          counts.all = row.count;
        } else if (row.stage_key in counts) {
          counts[row.stage_key as WorkflowStage] = row.count;
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`[WorkflowStageCounts] ${(performance.now() - startTime).toFixed(0)}ms`, counts);
      }

      return counts;
    },
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
}
