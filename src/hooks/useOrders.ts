import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * DEPRECATED: Orders realtime đã được tắt để tối ưu hiệu suất.
 * Sử dụng useManualRefresh().refreshOrders() từ useSystemRealtime để refresh thủ công.
 */
function useOrdersRealtime() {
  // Realtime cho orders đã được tắt để tối ưu hiệu suất
  console.log('[Realtime] Orders realtime disabled - use manual refresh instead');
}

export interface Order {
  id: string;
  code: string;
  company_id: string | null;
  union_id: string | null;
  job_category_id: string | null;
  work_address: string | null;
  quantity: number | null;
  contract_term: number | null;
  gender_requirement: string | null;
  expected_interview_date: string | null;
  status: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  company?: { name: string } | null;
  union?: { name: string } | null;
  job_category?: { name: string } | null;
}

export interface OrderFormData {
  code: string;
  company_id?: string | null;
  union_id?: string | null;
  job_category_id?: string | null;
  work_address?: string | null;
  quantity?: number | null;
  contract_term?: number | null;
  gender_requirement?: string | null;
  expected_interview_date?: string | null;
  status?: string | null;
  image_url?: string | null;
  notes?: string | null;
}

export function useOrders() {
  // Subscribe to realtime changes
  useOrdersRealtime();
  
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          company:companies!fk_orders_company(name),
          union:unions!fk_orders_union(name),
          job_category:job_categories!fk_orders_job_category(name)
        `)
        .order("code", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });
}

// SYSTEM RULE: Logic tính toán nằm ở Supabase view order_stats
// Frontend chỉ hiển thị, không tính toán
interface OrderStatsRow {
  total: number;
  recruiting: number;
  form_complete: number;
  interviewed: number;
  completed: number;
  cancelled: number;
}

export function useOrderStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["order-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_stats")
        .select("*")
        .single();

      if (error) throw error;
      return data as OrderStatsRow;
    },
    staleTime: 30 * 1000,
  });

  return {
    total: data?.total || 0,
    recruiting: data?.recruiting || 0,
    formComplete: data?.form_complete || 0,
    interviewed: data?.interviewed || 0,
    isLoading,
  };
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OrderFormData) => {
      const { data: result, error } = await supabase
        .from("orders")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Tạo đơn hàng thành công!");
    },
    onError: (error: Error) => {
      toast.error("Lỗi khi tạo đơn hàng: " + error.message);
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrderFormData> }) => {
      const { data: result, error } = await supabase
        .from("orders")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Cập nhật đơn hàng thành công!");
    },
    onError: (error: Error) => {
      toast.error("Lỗi khi cập nhật: " + error.message);
    },
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, code")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

export function useUnions() {
  return useQuery({
    queryKey: ["unions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unions")
        .select("id, name, code")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

export function useJobCategories() {
  return useQuery({
    queryKey: ["job_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_categories")
        .select("id, name, code")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}
