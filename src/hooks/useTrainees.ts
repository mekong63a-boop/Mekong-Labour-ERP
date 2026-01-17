import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trainee } from "@/types/trainee";
import { Database } from "@/integrations/supabase/types";

type TraineeUpdate = Database["public"]["Tables"]["trainees"]["Update"];

/**
 * DEPRECATED: Trainees realtime đã được tắt để tối ưu hiệu suất.
 * Bảng trainees là bảng lớn, không nên dùng realtime.
 * Sử dụng useManualRefresh().refreshTrainees() để refresh thủ công.
 */
export function useTraineesRealtime() {
  // Realtime cho trainees đã được tắt để tối ưu hiệu suất
  console.log('[Realtime] Trainees realtime disabled - use manual refresh instead');
}

/**
 * Hook lấy danh sách trainees với dữ liệu đã được che giấu
 * - Admin & Senior Staff: xem dữ liệu thực
 * - Staff thường: dữ liệu nhạy cảm bị che (phone, cccd, passport, địa chỉ)
 */
export function useTrainees() {
  return useQuery({
    queryKey: ["trainees"],
    queryFn: async () => {
      // Sử dụng view trainees_masked để tự động che giấu dữ liệu nhạy cảm
      const { data, error } = await supabase
        .from("trainees_masked")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Trainee[];
    },
  });
}

/**
 * Hook lấy chi tiết 1 trainee với dữ liệu đã được che giấu
 */
export function useTrainee(id: string) {
  return useQuery({
    queryKey: ["trainee", id],
    queryFn: async () => {
      // Sử dụng view trainees_masked để tự động che giấu dữ liệu nhạy cảm
      const { data, error } = await supabase
        .from("trainees_masked")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as Trainee;
    },
    enabled: !!id,
  });
}

export function useUpdateTrainee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TraineeUpdate }) => {
      const { data, error } = await supabase
        .from("trainees")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["trainee", data.id] });
    },
  });
}

export function useDeleteTrainee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trainees")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["trainee-stage-counts"] });
    },
  });
}
