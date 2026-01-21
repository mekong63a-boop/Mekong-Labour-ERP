import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Dormitory {
  id: string;
  name: string;
  address: string | null;
  capacity: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DormitoryResident {
  id: string;
  dormitory_id: string;
  trainee_id: string;
  check_in_date: string;
  check_out_date: string | null;
  room_number: string | null;
  bed_number: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  trainee?: {
    id: string;
    trainee_code: string;
    full_name: string;
    photo_url: string | null;
    phone: string | null;
    class_id: string | null;
  };
  dormitory?: Dormitory;
}

// Hook to get all dormitories
export function useDormitories() {
  return useQuery({
    queryKey: ["dormitories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dormitories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Dormitory[];
    },
  });
}

// Hook to get dormitory with resident count
export function useDormitoriesWithCount() {
  return useQuery({
    queryKey: ["dormitories-with-count"],
    queryFn: async () => {
      const { data: dormitories, error: dormError } = await supabase
        .from("dormitories")
        .select("*")
        .order("name", { ascending: true });

      if (dormError) throw dormError;

      // Get resident counts for each dormitory
      const { data: counts, error: countError } = await supabase
        .from("dormitory_residents")
        .select("dormitory_id")
        .eq("status", "Đang ở");

      if (countError) throw countError;

      // Count residents per dormitory
      const countMap = new Map<string, number>();
      counts?.forEach((r) => {
        const current = countMap.get(r.dormitory_id) || 0;
        countMap.set(r.dormitory_id, current + 1);
      });

      return (dormitories as Dormitory[]).map((d) => ({
        ...d,
        current_occupancy: countMap.get(d.id) || 0,
      }));
    },
  });
}

// Hook to get residents of a specific dormitory
export function useDormitoryResidents(dormitoryId: string | null) {
  return useQuery({
    queryKey: ["dormitory-residents", dormitoryId],
    queryFn: async () => {
      if (!dormitoryId) return [];

      const { data, error } = await supabase
        .from("dormitory_residents")
        .select(`
          *,
          trainee:trainees(id, trainee_code, full_name, photo_url, phone, class_id)
        `)
        .eq("dormitory_id", dormitoryId)
        .order("room_number", { ascending: true });

      if (error) throw error;
      return data as DormitoryResident[];
    },
    enabled: !!dormitoryId,
  });
}

// Hook to create a new dormitory
export function useCreateDormitory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      address?: string;
      capacity?: number;
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("dormitories")
        .insert({
          name: data.name,
          address: data.address || null,
          capacity: data.capacity || 20,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dormitories"] });
      queryClient.invalidateQueries({ queryKey: ["dormitories-with-count"] });
      toast.success("Đã thêm KTX mới");
    },
    onError: (error) => {
      toast.error("Lỗi thêm KTX: " + error.message);
    },
  });
}

// Hook to update a dormitory
export function useUpdateDormitory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Dormitory>;
    }) => {
      const { data, error } = await supabase
        .from("dormitories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dormitories"] });
      queryClient.invalidateQueries({ queryKey: ["dormitories-with-count"] });
      toast.success("Đã cập nhật KTX");
    },
    onError: (error) => {
      toast.error("Lỗi cập nhật: " + error.message);
    },
  });
}

// Hook to delete a dormitory
export function useDeleteDormitory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dormitories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dormitories"] });
      queryClient.invalidateQueries({ queryKey: ["dormitories-with-count"] });
      toast.success("Đã xóa KTX");
    },
    onError: (error) => {
      toast.error("Lỗi xóa: " + error.message);
    },
  });
}

// Hook to add trainee to dormitory
export function useAddResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      dormitory_id: string;
      trainee_id: string;
      room_number?: string;
      bed_number?: string;
      check_in_date?: string;
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("dormitory_residents")
        .insert({
          dormitory_id: data.dormitory_id,
          trainee_id: data.trainee_id,
          room_number: data.room_number || null,
          bed_number: data.bed_number || null,
          check_in_date: data.check_in_date || new Date().toISOString().split("T")[0],
          notes: data.notes || null,
          status: "Đang ở",
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dormitory-residents"] });
      queryClient.invalidateQueries({ queryKey: ["dormitories-with-count"] });
      toast.success("Đã thêm học viên vào KTX");
    },
    onError: (error) => {
      toast.error("Lỗi thêm học viên: " + error.message);
    },
  });
}

// Hook to update resident info
export function useUpdateResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<DormitoryResident>;
    }) => {
      const { data, error } = await supabase
        .from("dormitory_residents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dormitory-residents"] });
      queryClient.invalidateQueries({ queryKey: ["dormitories-with-count"] });
      toast.success("Đã cập nhật thông tin");
    },
    onError: (error) => {
      toast.error("Lỗi cập nhật: " + error.message);
    },
  });
}

// Hook to check out resident (mark as moved out)
export function useCheckOutResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      check_out_date,
    }: {
      id: string;
      check_out_date?: string;
    }) => {
      const { data, error } = await supabase
        .from("dormitory_residents")
        .update({
          status: "Đã rời",
          check_out_date: check_out_date || new Date().toISOString().split("T")[0],
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dormitory-residents"] });
      queryClient.invalidateQueries({ queryKey: ["dormitories-with-count"] });
      toast.success("Học viên đã rời KTX");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });
}

// Hook to remove resident completely
export function useRemoveResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dormitory_residents")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dormitory-residents"] });
      queryClient.invalidateQueries({ queryKey: ["dormitories-with-count"] });
      toast.success("Đã xóa học viên khỏi KTX");
    },
    onError: (error) => {
      toast.error("Lỗi xóa: " + error.message);
    },
  });
}

// Hook to get trainees not in any dormitory (for adding to dormitory)
export function useAvailableTrainees() {
  return useQuery({
    queryKey: ["available-trainees-for-dormitory"],
    queryFn: async () => {
      // Get all trainees currently in dormitory
      const { data: residents, error: resError } = await supabase
        .from("dormitory_residents")
        .select("trainee_id")
        .eq("status", "Đang ở");

      if (resError) throw resError;

      const occupiedTraineeIds = residents?.map((r) => r.trainee_id) || [];

      // Get trainees in dormitory stage or trained stage
      let query = supabase
        .from("trainees")
        .select("id, trainee_code, full_name, photo_url, phone")
        .in("progression_stage", ["Đậu phỏng vấn", "Nộp hồ sơ", "OTIT", "Nyukan", "COE"])
        .order("full_name", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Filter out trainees already in dormitory
      return (data || []).filter((t) => !occupiedTraineeIds.includes(t.id));
    },
  });
}
