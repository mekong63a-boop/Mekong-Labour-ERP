import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useTraineesRealtime } from './useTrainees';

type ProgressionStage = Database['public']['Enums']['progression_stage'];
type SimpleStatus = Database['public']['Enums']['simple_status'];
type TraineeType = Database['public']['Enums']['trainee_type'];

export interface TraineeListItem {
  id: string;
  trainee_code: string;
  full_name: string;
  birth_date: string | null;
  birthplace: string | null;
  progression_stage: ProgressionStage | null;
  simple_status: SimpleStatus | null;
  enrollment_status: string | null;
  trainee_type: TraineeType | null;
  entry_date: string | null;
  interview_pass_date: string | null;
  document_submission_date: string | null;
  otit_entry_date: string | null;
  nyukan_entry_date: string | null;
  coe_date: string | null;
  departure_date: string | null;
  expected_return_date: string | null;
  absconded_date: string | null;
  early_return_date: string | null;
  early_return_reason: string | null;
  return_date: string | null;
  contract_term: number | null;
  updated_at: string | null;
  receiving_company: { id: string; name: string; name_japanese: string | null } | null;
  union: { id: string; name: string; name_japanese: string | null } | null;
  job_category: { id: string; name: string; name_japanese: string | null } | null;
}

interface UseTraineesPaginatedParams {
  from: number;
  to: number;
  progressionStage?: string | null;
  searchQuery?: string;
  enabled?: boolean;
}

interface UseTraineesPaginatedResult {
  trainees: TraineeListItem[];
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

// Valid progression stages for type safety
const VALID_PROGRESSION_STAGES: ProgressionStage[] = [
  'Chưa đậu', 'Đậu phỏng vấn', 'Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE', 'Visa',
  'Xuất cảnh', 'Đang làm việc', 'Hoàn thành hợp đồng', 'Bỏ trốn', 'Về trước hạn'
];

export function useTraineesPaginated({
  from,
  to,
  progressionStage,
  searchQuery,
  enabled = true,
}: UseTraineesPaginatedParams): UseTraineesPaginatedResult {
  
  // Subscribe to realtime changes for auto-refresh across all browsers
  useTraineesRealtime();
  
  // Query for count
  const countQuery = useQuery({
    queryKey: ['trainees-count', progressionStage, searchQuery],
    queryFn: async () => {
      const startTime = performance.now();
      
      let query = supabase
        .from('trainees')
        .select('*', { count: 'exact', head: true });

      // Apply progression stage filter with type safety
      if (progressionStage && progressionStage !== 'all' && 
          VALID_PROGRESSION_STAGES.includes(progressionStage as ProgressionStage)) {
        query = query.eq('progression_stage', progressionStage as ProgressionStage);
      }

      // Apply search filter using ILIKE for partial matching
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`full_name.ilike.${searchTerm},trainee_code.ilike.${searchTerm},birthplace.ilike.${searchTerm}`);
      }

      const { count, error } = await query;

      if (error) throw error;

      if (process.env.NODE_ENV === 'development') {
        console.log(`[TraineeCount] ${(performance.now() - startTime).toFixed(0)}ms, total: ${count}`);
      }

      return count || 0;
    },
    enabled,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Query for data
  const dataQuery = useQuery({
    queryKey: ['trainees-paginated', from, to, progressionStage, searchQuery],
    queryFn: async () => {
      const startTime = performance.now();

      let query = supabase
        .from('trainees')
        .select(`
          id,
          trainee_code,
          full_name,
          birth_date,
          birthplace,
          progression_stage,
          simple_status,
          enrollment_status,
          trainee_type,
          entry_date,
          interview_pass_date,
          document_submission_date,
          otit_entry_date,
          nyukan_entry_date,
          coe_date,
          departure_date,
          expected_return_date,
          absconded_date,
          early_return_date,
          early_return_reason,
          return_date,
          contract_term,
          updated_at,
          receiving_company_id,
          union_id,
          job_category_id
        `);

      // Apply progression stage filter with type safety
      if (progressionStage && progressionStage !== 'all' &&
          VALID_PROGRESSION_STAGES.includes(progressionStage as ProgressionStage)) {
        query = query.eq('progression_stage', progressionStage as ProgressionStage);
      }

      // Apply search filter
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`full_name.ilike.${searchTerm},trainee_code.ilike.${searchTerm},birthplace.ilike.${searchTerm}`);
      }

      // Order by updated_at DESC for most recent first
      query = query.order('updated_at', { ascending: false, nullsFirst: false });

      // Apply pagination
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      // Fetch related data separately for proper typing
      const companyIds = [...new Set(data?.map(t => t.receiving_company_id).filter(Boolean) as string[])];
      const unionIds = [...new Set(data?.map(t => t.union_id).filter(Boolean) as string[])];
      const jobCategoryIds = [...new Set(data?.map(t => t.job_category_id).filter(Boolean) as string[])];

      const [companiesRes, unionsRes, jobCategoriesRes] = await Promise.all([
        companyIds.length > 0 
          ? supabase.from('companies').select('id, name, name_japanese').in('id', companyIds)
          : { data: [] as { id: string; name: string; name_japanese: string | null }[] },
        unionIds.length > 0
          ? supabase.from('unions').select('id, name, name_japanese').in('id', unionIds)
          : { data: [] as { id: string; name: string; name_japanese: string | null }[] },
        jobCategoryIds.length > 0
          ? supabase.from('job_categories').select('id, name, name_japanese').in('id', jobCategoryIds)
          : { data: [] as { id: string; name: string; name_japanese: string | null }[] },
      ]);

      const companiesMap = new Map((companiesRes.data || []).map(c => [c.id, c]));
      const unionsMap = new Map((unionsRes.data || []).map(u => [u.id, u]));
      const jobCategoriesMap = new Map((jobCategoriesRes.data || []).map(j => [j.id, j]));

      if (process.env.NODE_ENV === 'development') {
        console.log(`[TraineeQuery] page from=${from} to=${to}, ${(performance.now() - startTime).toFixed(0)}ms, fetched: ${data?.length || 0}`);
      }

      // Transform data to match expected format
      const trainees: TraineeListItem[] = (data || []).map((trainee) => ({
        id: trainee.id,
        trainee_code: trainee.trainee_code,
        full_name: trainee.full_name,
        birth_date: trainee.birth_date,
        birthplace: trainee.birthplace,
        progression_stage: trainee.progression_stage,
        simple_status: trainee.simple_status,
        enrollment_status: trainee.enrollment_status,
        trainee_type: trainee.trainee_type,
        entry_date: trainee.entry_date,
        interview_pass_date: trainee.interview_pass_date,
        document_submission_date: trainee.document_submission_date,
        otit_entry_date: trainee.otit_entry_date,
        nyukan_entry_date: trainee.nyukan_entry_date,
        coe_date: trainee.coe_date,
        departure_date: trainee.departure_date,
        expected_return_date: trainee.expected_return_date,
        absconded_date: trainee.absconded_date,
        early_return_date: trainee.early_return_date,
        early_return_reason: trainee.early_return_reason,
        return_date: trainee.return_date,
        contract_term: trainee.contract_term,
        updated_at: trainee.updated_at,
        receiving_company: trainee.receiving_company_id ? companiesMap.get(trainee.receiving_company_id) || null : null,
        union: trainee.union_id ? unionsMap.get(trainee.union_id) || null : null,
        job_category: trainee.job_category_id ? jobCategoriesMap.get(trainee.job_category_id) || null : null,
      }));

      return trainees;
    },
    enabled: enabled && countQuery.data !== undefined,
    staleTime: 10000, // Cache for 10 seconds
  });

  return {
    trainees: dataQuery.data || [],
    totalCount: countQuery.data || 0,
    isLoading: countQuery.isLoading || dataQuery.isLoading,
    isError: countQuery.isError || dataQuery.isError,
    error: countQuery.error || dataQuery.error,
    refetch: () => {
      countQuery.refetch();
      dataQuery.refetch();
    },
  };
}
