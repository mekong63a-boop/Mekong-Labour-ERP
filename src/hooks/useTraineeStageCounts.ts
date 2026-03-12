import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StageCounts } from '@/components/trainees/StageTabsGrid';

// =============================================================================
// Hook đếm số lượng học viên theo progression_stage
// SOURCE OF TRUTH: PostgreSQL view trainee_stage_counts
// SYSTEM RULE: Logic tính toán nằm ở Supabase, frontend chỉ hiển thị
// =============================================================================

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

      // Build counts object từ view data (view returns progression_stage, count)
      const counts: StageCounts = {
        all: 0,
        'ChuaDau': 0,
        'DauPV': 0,
        'NopHS': 0,
        'OTIT': 0,
        'Nyukan': 0,
        'COE': 0,
        'Visa': 0,
        'DaXuatCanh': 0,
        'DangLamViec': 0,
        'BoTron': 0,
        'VeNuocSom': 0,
        'HoanThanhHD': 0,
      };

      data?.forEach((row: any) => {
        const stage = row.progression_stage;
        if (stage && stage in counts) {
          counts[stage as keyof StageCounts] = row.count;
        }
      });

      // Calculate total
      counts.all = Object.entries(counts)
        .filter(([key]) => key !== 'all')
        .reduce((sum, [, val]) => sum + val, 0);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[StageCounts] ${(performance.now() - startTime).toFixed(0)}ms (via DB view)`, counts);
      }

      return counts;
    },
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
}
