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
  transfer_reason: string | null;
  from_dormitory_id: string | null;
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
  from_dormitory?: Dormitory;
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
// SYSTEM RULE: Logic tính toán nằm ở Supabase view dormitories_with_occupancy
export function useDormitoriesWithCount() {
  return useQuery({
    queryKey: ["dormitories-with-count"],
    queryFn: async () => {
      // Query từ database view - logic tính toán đã ở Supabase
      const { data, error } = await supabase
        .from("dormitories_with_occupancy")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      return data as (Dormitory & { current_occupancy: number })[];
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
          trainee:trainees(id, trainee_code, full_name, photo_url, phone, class_id),
          from_dormitory:dormitories!dormitory_residents_from_dormitory_id_fkey(id, name)
        `)
        .eq("dormitory_id", dormitoryId)
        .order("room_number", { ascending: true });

      if (error) throw error;
      return data as DormitoryResident[];
    },
    enabled: !!dormitoryId,
  });
}

// Hook to get all dormitory history for a trainee
export function useTraineeDormitoryHistory(traineeId: string | null) {
  return useQuery({
    queryKey: ["trainee-dormitory-history", traineeId],
    queryFn: async () => {
      if (!traineeId) return [];

      const { data, error } = await supabase
        .from("dormitory_residents")
        .select(`
          *,
          dormitory:dormitories!dormitory_residents_dormitory_id_fkey(id, name, address),
          from_dormitory:dormitories!dormitory_residents_from_dormitory_id_fkey(id, name)
        `)
        .eq("trainee_id", traineeId)
        .order("check_in_date", { ascending: false });

      if (error) throw error;
      return data as DormitoryResident[];
    },
    enabled: !!traineeId,
  });
}

// Hook to search trainees and their dormitory status
export function useSearchTraineeDormitory(searchTerm: string) {
  return useQuery({
    queryKey: ["search-trainee-dormitory", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      // Search trainees by name or code
      const { data: trainees, error: traineeError } = await supabase
        .from("trainees")
        .select("id, trainee_code, full_name, photo_url, phone")
        .or(`full_name.ilike.%${searchTerm}%,trainee_code.ilike.%${searchTerm}%`)
        .limit(20);

      if (traineeError) throw traineeError;
      if (!trainees || trainees.length === 0) return [];

      const traineeIds = trainees.map((t) => t.id);

      // Get all dormitory records for these trainees
      const { data: residents, error: resError } = await supabase
        .from("dormitory_residents")
        .select(`
          *,
          dormitory:dormitories!dormitory_residents_dormitory_id_fkey(id, name, address),
          from_dormitory:dormitories!dormitory_residents_from_dormitory_id_fkey(id, name)
        `)
        .in("trainee_id", traineeIds)
        .order("check_in_date", { ascending: false });

      if (resError) throw resError;

      // Group by trainee
      const result = trainees.map((trainee) => {
        const traineeRecords = (residents || []).filter((r) => r.trainee_id === trainee.id);
        const currentDorm = traineeRecords.find((r) => r.status === "Đang ở");
        return {
          trainee,
          currentDormitory: currentDorm?.dormitory || null,
          currentRecord: currentDorm || null,
          history: traineeRecords,
        };
      });

      return result;
    },
    enabled: searchTerm.length >= 2,
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
      transfer_reason,
    }: {
      id: string;
      check_out_date?: string;
      transfer_reason?: string;
    }) => {
      const { data, error } = await supabase
        .from("dormitory_residents")
        .update({
          status: "Đã rời",
          check_out_date: check_out_date || new Date().toISOString().split("T")[0],
          transfer_reason: transfer_reason || null,
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
      queryClient.invalidateQueries({ queryKey: ["trainee-dormitory-history"] });
      toast.success("Học viên đã rời KTX");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });
}

// Hook to transfer trainee to another dormitory
export function useTransferResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      currentResidentId,
      traineeId,
      fromDormitoryId,
      toDormitoryId,
      roomNumber,
      bedNumber,
      transferReason,
    }: {
      currentResidentId: string;
      traineeId: string;
      fromDormitoryId: string;
      toDormitoryId: string;
      roomNumber?: string;
      bedNumber?: string;
      transferReason: string;
    }) => {
      const today = new Date().toISOString().split("T")[0];

      // Step 1: Check out from current dormitory
      const { error: checkOutError } = await supabase
        .from("dormitory_residents")
        .update({
          status: "Đã chuyển",
          check_out_date: today,
          transfer_reason: transferReason,
        })
        .eq("id", currentResidentId);

      if (checkOutError) throw checkOutError;

      // Step 2: Add to new dormitory with reference to old one
      const { data, error: addError } = await supabase
        .from("dormitory_residents")
        .insert({
          dormitory_id: toDormitoryId,
          trainee_id: traineeId,
          from_dormitory_id: fromDormitoryId,
          room_number: roomNumber || null,
          bed_number: bedNumber || null,
          check_in_date: today,
          status: "Đang ở",
          transfer_reason: `Chuyển từ KTX khác: ${transferReason}`,
        })
        .select()
        .single();

      if (addError) throw addError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dormitory-residents"] });
      queryClient.invalidateQueries({ queryKey: ["dormitories-with-count"] });
      queryClient.invalidateQueries({ queryKey: ["trainee-dormitory-history"] });
      queryClient.invalidateQueries({ queryKey: ["available-trainees-for-dormitory"] });
      toast.success("Đã chuyển học viên sang KTX mới");
    },
    onError: (error) => {
      toast.error("Lỗi chuyển KTX: " + error.message);
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

// Hook to get trainees currently in OTHER dormitories (for transfer)
export function useTraineesInOtherDormitories(excludeDormitoryId: string | null) {
  return useQuery({
    queryKey: ["trainees-in-other-dormitories", excludeDormitoryId],
    queryFn: async () => {
      if (!excludeDormitoryId) return [];

      const { data, error } = await supabase
        .from("dormitory_residents")
        .select(`
          id,
          dormitory_id,
          trainee_id,
          room_number,
          bed_number,
          trainee:trainees(id, trainee_code, full_name, photo_url, phone),
          dormitory:dormitories!dormitory_residents_dormitory_id_fkey(id, name)
        `)
        .eq("status", "Đang ở")
        .neq("dormitory_id", excludeDormitoryId);

      if (error) throw error;
      return data as (DormitoryResident & { dormitory: Dormitory })[];
    },
    enabled: !!excludeDormitoryId,
  });
}

// Hook to get gender statistics for current dormitory residents
// SYSTEM RULE: Logic tính toán từ database view dormitory_gender_stats
export function useDormitoryGenderStats() {
  return useQuery({
    queryKey: ["dormitory-gender-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dormitory_gender_stats")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data as {
        total_residents: number;
        male_count: number;
        female_count: number;
      } | null;
    },
  });
}
