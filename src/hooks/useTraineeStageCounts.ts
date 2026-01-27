import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StageCounts } from '@/components/trainees/StageTabsGrid';

// =============================================================================
// Hook đếm số lượng học viên theo progression_stage
// SOURCE OF TRUTH: PostgreSQL view trainee_stage_counts
// SYSTEM RULE: Logic tính toán nằm ở Supabase, frontend chỉ hiển thị
// =============================================================================

interface StageCountRow {
  stage: string;
  count: number;
}

export function useTraineeStageCounts() {
  return useQuery({
    queryKey: ['trainee-stage-counts'],
    queryFn: async () => {
      const startTime = performance.now();

      // Query từ database view - single query thay vì 13 parallel queries
      const { data, error } = await supabase
        .from('trainee_stage_counts')
        .select('*');

      if (error) throw error;

      // Build counts object từ view data
      const counts: StageCounts = {
        all: 0,
        'Chưa đậu': 0,
        'Đậu phỏng vấn': 0,
        'Nộp hồ sơ': 0,
        'OTIT': 0,
        'Nyukan': 0,
        'COE': 0,
        'Visa': 0,
        'Xuất cảnh': 0,
        'Đang làm việc': 0,
        'Bỏ trốn': 0,
        'Về trước hạn': 0,
        'Hoàn thành hợp đồng': 0,
      };

      (data as StageCountRow[])?.forEach(({ stage, count }) => {
        if (stage in counts) {
          counts[stage as keyof StageCounts] = count;
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`[StageCounts] ${(performance.now() - startTime).toFixed(0)}ms (via DB view)`, counts);
      }

      return counts;
    },
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
}
