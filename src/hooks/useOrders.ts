import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          company:companies(name),
          union:unions(name),
          job_category:job_categories(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrderStats() {
  const { data: orders } = useOrders();

  const stats = {
    total: orders?.length || 0,
    recruiting: orders?.filter((o) => o.status === "Đang tuyển").length || 0,
    formComplete: orders?.filter((o) => o.status === "Đã đủ form").length || 0,
    interviewed: orders?.filter((o) => o.status === "Đã phỏng vấn").length || 0,
  };

  return stats;
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
