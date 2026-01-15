import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
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
        .order("created_at", { ascending: false });
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
        .order("created_at", { ascending: false });
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
