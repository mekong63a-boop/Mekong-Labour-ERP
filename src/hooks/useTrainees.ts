import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trainee } from "@/types/trainee";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type TraineeUpdate = Database["public"]["Tables"]["trainees"]["Update"];

/**
 * Hook lấy chi tiết 1 trainee - SINGLE SOURCE OF TRUTH
 */
export function useTrainee(id: string) {
  return useQuery({
    queryKey: ["trainee", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Trainee;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook cập nhật trainee với OPTIMISTIC UPDATE
 * Cập nhật cache ngay lập tức, không cần refetch toàn bộ danh sách
 */
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
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["trainee", id] });

      const previousTrainee = queryClient.getQueryData<Trainee>(["trainee", id]);

      if (previousTrainee) {
        queryClient.setQueryData<Trainee>(["trainee", id], {
          ...previousTrainee,
          ...updates,
          updated_at: new Date().toISOString(),
        } as Trainee);
      }

      return { previousTrainee };
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Trainee>(["trainee", data.id], data as Trainee);
    },
    onError: (err, { id }, context) => {
      if (context?.previousTrainee) {
        queryClient.setQueryData(["trainee", id], context.previousTrainee);
      }
    },
  });
}

export function useDeleteTrainee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .rpc("soft_delete_trainee", { p_trainee_id: id });

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: ["trainee", id] });
      queryClient.invalidateQueries({ queryKey: ["trainees-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["trainee-stage-counts"] });
      queryClient.invalidateQueries({ queryKey: ["trainees-count"] });
    },
  });
}

/**
 * Hook khóa/mở khóa học viên - tất cả Admin có quyền
 */
export function useToggleTraineeLock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_locked }: { id: string; is_locked: boolean }) => {
      const { data, error } = await supabase
        .from("trainees")
        .update({
          is_locked,
          locked_at: is_locked ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Trainee>(["trainee", data.id], data as Trainee);
      queryClient.invalidateQueries({ queryKey: ["trainees-paginated"] });
      toast({
        title: data.is_locked ? "Đã khóa hồ sơ" : "Đã mở khóa hồ sơ",
        description: data.is_locked 
          ? "Chỉ Admin mới có thể chỉnh sửa hồ sơ này." 
          : "Hồ sơ đã được mở khóa, mọi người có quyền đều có thể chỉnh sửa.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thay đổi trạng thái khóa",
        variant: "destructive",
      });
    },
  });
}
