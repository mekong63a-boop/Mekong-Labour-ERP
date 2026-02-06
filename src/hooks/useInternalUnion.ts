import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * DEPRECATED: Internal Union realtime đã được tắt để tối ưu hiệu suất.
 * Sử dụng manual refresh để cập nhật dữ liệu.
 */
function useInternalUnionRealtime() {
  // Realtime cho internal union đã được tắt để tối ưu hiệu suất
  console.log('[Realtime] Internal Union realtime disabled - use manual refresh instead');
}

export interface UnionMember {
  id: string;
  member_code: string;
  full_name: string;
  birth_date: string | null;
  hometown: string | null;
  join_date: string;
  end_date: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnionTransaction {
  id: string;
  transaction_type: 'Thu' | 'Chi';
  amount: number;
  transaction_date: string;
  member_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  member?: UnionMember;
}

export const useUnionMembers = () => {
  // Subscribe to realtime changes
  useInternalUnionRealtime();
  
  return useQuery({
    queryKey: ['union-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('union_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UnionMember[];
    },
  });
};

export const useUnionTransactions = () => {
  return useQuery({
    queryKey: ['union-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('union_transactions')
        .select('*, member:union_members(*)')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as UnionTransaction[];
    },
  });
};

// SYSTEM RULE: Logic tính toán nằm ở Supabase view union_stats
// Financial logic must reside in database, not frontend
interface UnionStatsRow {
  active_members: number;
  total_members: number;
  total_income: number;
  total_expense: number;
  balance: number;
}

export const useUnionStats = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['union-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('union_stats')
        .select('*')
        .single();

      if (error) throw error;
      return data as UnionStatsRow;
    },
  });

  return {
    activeMembers: data?.active_members || 0,
    totalIncome: data?.total_income || 0,
    totalExpense: data?.total_expense || 0,
    balance: data?.balance || 0,
    isLoading,
  };
};

export const useCreateUnionMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<UnionMember, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('union_members')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['union-members'] });
      toast.success('Thêm thành viên thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    },
  });
};

export const useUpdateUnionMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<UnionMember> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('union_members')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['union-members'] });
      toast.success('Cập nhật thành viên thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    },
  });
};

export const useDeleteUnionMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('union_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['union-members'] });
      toast.success('Xóa thành viên thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    },
  });
};

export const useCreateUnionTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<UnionTransaction, 'id' | 'created_at' | 'updated_at' | 'member'>) => {
      const { data: result, error } = await supabase
        .from('union_transactions')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['union-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['union-stats'] });
      toast.success('Thêm giao dịch thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    },
  });
};

export const useDeleteUnionTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('union_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['union-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['union-stats'] });
      toast.success('Xóa giao dịch thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    },
  });
};
