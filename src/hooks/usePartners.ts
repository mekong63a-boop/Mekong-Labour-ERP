import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * DEPRECATED: Partners realtime đã được tắt để tối ưu hiệu suất.
 * Sử dụng useManualRefresh().refreshPartners() từ useSystemRealtime để refresh thủ công.
 */
function usePartnersRealtime() {
  // Realtime cho partners đã được tắt để tối ưu hiệu suất
  console.log('[Realtime] Partners realtime disabled - use manual refresh instead');
}

// Companies
export interface Company {
  id: string;
  code: string;
  name: string;
  name_japanese: string | null;
  address: string | null;
  work_address: string | null;
  representative: string | null;
  position: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCompanies() {
  // Subscribe to realtime changes
  usePartnersRealtime();
  
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("code", { ascending: false });
      if (error) throw error;
      return data as Company[];
    },
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Company, "id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("companies")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Tạo công ty thành công!");
    },
    onError: (error: Error) => toast.error("Lỗi: " + error.message),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Company> }) => {
      const { data: result, error } = await supabase
        .from("companies")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Cập nhật thành công!");
    },
    onError: (error: Error) => toast.error("Lỗi: " + error.message),
  });
}

// Unions
export interface Union {
  id: string;
  code: string;
  name: string;
  name_japanese: string | null;
  address: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useUnions() {
  return useQuery({
    queryKey: ["unions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unions")
        .select("*")
        .order("code", { ascending: false });
      if (error) throw error;
      return data as Union[];
    },
  });
}

export function useCreateUnion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Union, "id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("unions")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unions"] });
      toast.success("Tạo nghiệp đoàn thành công!");
    },
    onError: (error: Error) => toast.error("Lỗi: " + error.message),
  });
}

export function useUpdateUnion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Union> }) => {
      const { data: result, error } = await supabase
        .from("unions")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unions"] });
      toast.success("Cập nhật thành công!");
    },
    onError: (error: Error) => toast.error("Lỗi: " + error.message),
  });
}

// Job Categories
export interface JobCategory {
  id: string;
  code: string;
  name: string;
  name_japanese: string | null;
  category: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export function useJobCategories() {
  return useQuery({
    queryKey: ["job_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_categories")
        .select("*")
        .order("code", { ascending: false });
      if (error) throw error;
      return data as JobCategory[];
    },
  });
}

export function useCreateJobCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<JobCategory, "id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("job_categories")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_categories"] });
      toast.success("Tạo ngành nghề thành công!");
    },
    onError: (error: Error) => toast.error("Lỗi: " + error.message),
  });
}

export function useUpdateJobCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<JobCategory> }) => {
      const { data: result, error } = await supabase
        .from("job_categories")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_categories"] });
      toast.success("Cập nhật thành công!");
    },
    onError: (error: Error) => toast.error("Lỗi: " + error.message),
  });
}

export function useDeleteJobCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Check if job category is being used by trainees
      const { count: traineeCount } = await supabase
        .from("trainees")
        .select("id", { count: "exact", head: true })
        .eq("job_category_id", id);

      if (traineeCount && traineeCount > 0) {
        throw new Error(`Không thể xóa vì có ${traineeCount} học viên đang sử dụng ngành nghề này`);
      }

      // 1) Block delete if any ACTIVE orders reference this job category
      const { count: activeOrderCount, error: activeOrderCountError } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("job_category_id", id)
        .neq("status", "Hủy");
      if (activeOrderCountError) throw activeOrderCountError;

      if (activeOrderCount && activeOrderCount > 0) {
        throw new Error(`Không thể xóa vì có ${activeOrderCount} đơn hàng đang sử dụng ngành nghề này`);
      }

      // 2) If only CANCELLED orders reference it, detach them first so FK doesn't block the delete
      const { data: cancelledOrders, error: cancelledOrdersError } = await supabase
        .from("orders")
        .select("id")
        .eq("job_category_id", id)
        .eq("status", "Hủy");
      if (cancelledOrdersError) throw cancelledOrdersError;

      if ((cancelledOrders?.length ?? 0) > 0) {
        const { error: detachError } = await supabase
          .from("orders")
          .update({ job_category_id: null })
          .eq("job_category_id", id)
          .eq("status", "Hủy");
        if (detachError) throw detachError;
      }

      const { error } = await supabase.from("job_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_categories"] });
      toast.success("Xóa ngành nghề thành công!");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Check if company is being used by trainees
      const { count: traineeCount } = await supabase
        .from("trainees")
        .select("id", { count: "exact", head: true })
        .eq("receiving_company_id", id);

      if (traineeCount && traineeCount > 0) {
        throw new Error(`Không thể xóa vì có ${traineeCount} học viên đang liên kết với công ty này`);
      }

      // 1) Block delete if any ACTIVE orders reference this company
      const { count: activeOrderCount, error: activeOrderCountError } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("company_id", id)
        .neq("status", "Hủy");
      if (activeOrderCountError) throw activeOrderCountError;

      if (activeOrderCount && activeOrderCount > 0) {
        throw new Error(`Không thể xóa vì có ${activeOrderCount} đơn hàng đang liên kết với công ty này`);
      }

      // 2) Detach CANCELLED orders so FK doesn't block delete
      const { data: cancelledOrders, error: cancelledOrdersError } = await supabase
        .from("orders")
        .select("id")
        .eq("company_id", id)
        .eq("status", "Hủy");
      if (cancelledOrdersError) throw cancelledOrdersError;

      if ((cancelledOrders?.length ?? 0) > 0) {
        const { error: detachError } = await supabase
          .from("orders")
          .update({ company_id: null })
          .eq("company_id", id)
          .eq("status", "Hủy");
        if (detachError) throw detachError;
      }

      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Xóa công ty thành công!");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteUnion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Check if union is being used by trainees
      const { count: traineeCount } = await supabase
        .from("trainees")
        .select("id", { count: "exact", head: true })
        .eq("union_id", id);

      if (traineeCount && traineeCount > 0) {
        throw new Error(`Không thể xóa vì có ${traineeCount} học viên đang liên kết với nghiệp đoàn này`);
      }

      // 1) Block delete if any ACTIVE orders reference this union
      const { count: activeOrderCount, error: activeOrderCountError } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("union_id", id)
        .neq("status", "Hủy");
      if (activeOrderCountError) throw activeOrderCountError;

      if (activeOrderCount && activeOrderCount > 0) {
        throw new Error(`Không thể xóa vì có ${activeOrderCount} đơn hàng đang liên kết với nghiệp đoàn này`);
      }

      // 2) Detach CANCELLED orders so FK doesn't block delete
      const { data: cancelledOrders, error: cancelledOrdersError } = await supabase
        .from("orders")
        .select("id")
        .eq("union_id", id)
        .eq("status", "Hủy");
      if (cancelledOrdersError) throw cancelledOrdersError;

      if ((cancelledOrders?.length ?? 0) > 0) {
        const { error: detachError } = await supabase
          .from("orders")
          .update({ union_id: null })
          .eq("union_id", id)
          .eq("status", "Hủy");
        if (detachError) throw detachError;
      }

      const { error } = await supabase.from("unions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unions"] });
      toast.success("Xóa nghiệp đoàn thành công!");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
