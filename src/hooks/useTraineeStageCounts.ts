import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProgressionStage = Database['public']['Enums']['progression_stage'];

export interface StageCounts {
  all: number;
  'Chưa đậu': number;
  'Đậu phỏng vấn': number;
  'Nộp hồ sơ': number;
  'OTIT': number;
  'Nyukan': number;
  'COE': number;
  'Visa': number;
  'Xuất cảnh': number;
  'Đang làm việc': number;
  'Bỏ trốn': number;
  'Về trước hạn': number;
  'Hoàn thành hợp đồng': number;
}

const PROGRESSION_STAGES: ProgressionStage[] = [
  'Chưa đậu', 'Đậu phỏng vấn', 'Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE', 'Visa',
  'Xuất cảnh', 'Đang làm việc', 'Hoàn thành hợp đồng', 'Bỏ trốn', 'Về trước hạn'
];

export function useTraineeStageCounts() {
  return useQuery({
    queryKey: ['trainee-stage-counts'],
    queryFn: async () => {
      const startTime = performance.now();

      // Fetch all counts in parallel
      const countPromises = PROGRESSION_STAGES.map(async (stage) => {
        const { count, error } = await supabase
          .from('trainees')
          .select('*', { count: 'exact', head: true })
          .eq('progression_stage', stage);

        if (error) throw error;
        return { stage, count: count || 0 };
      });

      // Also get total count
      const totalPromise = supabase
        .from('trainees')
        .select('*', { count: 'exact', head: true });

      const [stageCounts, totalResult] = await Promise.all([
        Promise.all(countPromises),
        totalPromise,
      ]);

      if (totalResult.error) throw totalResult.error;

      // Build counts object
      const counts: StageCounts = {
        all: totalResult.count || 0,
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

      stageCounts.forEach(({ stage, count }) => {
        counts[stage] = count;
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`[StageCounts] ${(performance.now() - startTime).toFixed(0)}ms`, counts);
      }

      return counts;
    },
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
}
