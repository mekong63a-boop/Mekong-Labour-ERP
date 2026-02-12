import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trainee } from "@/types/trainee";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

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
 * Hook lấy danh sách trainees - SINGLE SOURCE OF TRUTH
 * Tất cả tài khoản đọc từ cùng 1 nguồn dữ liệu (bảng trainees)
 * Quyền xem/sửa dựa trên menu permissions
 */
export function useTrainees() {
  return useQuery({
    queryKey: ["trainees"],
    queryFn: async () => {
      // Single Source of Truth: đọc trực tiếp từ bảng trainees
      const { data, error } = await supabase
        .from("trainees")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Trainee[];
    },
    // Tối ưu: giữ cache lâu hơn, chỉ refetch khi cần
    staleTime: 30000, // 30 giây - dữ liệu vẫn fresh trong 30s
  });
}

/**
 * Hook lấy chi tiết 1 trainee - SINGLE SOURCE OF TRUTH
 */
export function useTrainee(id: string) {
  return useQuery({
    queryKey: ["trainee", id],
    queryFn: async () => {
      // Single Source of Truth: đọc trực tiếp từ bảng trainees
      const { data, error } = await supabase
        .from("trainees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Trainee;
    },
    enabled: !!id,
    staleTime: 30000, // 30 giây
  });
}

/**
 * Hook cập nhật trainee với OPTIMISTIC UPDATE
 * Cập nhật cache ngay lập tức, không cần refetch toàn bộ danh sách
 * Đây là chiến lược tối ưu cho hàng triệu bản ghi
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
    // OPTIMISTIC UPDATE: Cập nhật cache ngay lập tức
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["trainee", id] });
      await queryClient.cancelQueries({ queryKey: ["trainees"] });

      // Snapshot previous values
      const previousTrainee = queryClient.getQueryData<Trainee>(["trainee", id]);
      const previousTrainees = queryClient.getQueryData<Trainee[]>(["trainees"]);

      // Optimistically update single trainee cache
      if (previousTrainee) {
        queryClient.setQueryData<Trainee>(["trainee", id], {
          ...previousTrainee,
          ...updates,
          updated_at: new Date().toISOString(),
        } as Trainee);
      }

      // Optimistically update list cache (chỉ update 1 item, không refetch)
      if (previousTrainees) {
        queryClient.setQueryData<Trainee[]>(["trainees"], 
          previousTrainees.map(t => 
            t.id === id 
              ? { ...t, ...updates, updated_at: new Date().toISOString() } as Trainee
              : t
          )
        );
      }

      return { previousTrainee, previousTrainees };
    },
    // Nếu mutation thành công - chỉ update với data thực từ server
    onSuccess: (data) => {
      // Chỉ update cache với data thật, không invalidate
      queryClient.setQueryData<Trainee>(["trainee", data.id], data as Trainee);
      
      // Update trong list
      const trainees = queryClient.getQueryData<Trainee[]>(["trainees"]);
      if (trainees) {
        queryClient.setQueryData<Trainee[]>(["trainees"],
          trainees.map(t => t.id === data.id ? data as Trainee : t)
        );
      }
    },
    // Nếu mutation thất bại - rollback về giá trị cũ
    onError: (err, { id }, context) => {
      if (context?.previousTrainee) {
        queryClient.setQueryData(["trainee", id], context.previousTrainee);
      }
      if (context?.previousTrainees) {
        queryClient.setQueryData(["trainees"], context.previousTrainees);
      }
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
      return id;
    },
    // Optimistic delete
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["trainees"] });
      
      const previousTrainees = queryClient.getQueryData<Trainee[]>(["trainees"]);
      
      if (previousTrainees) {
        queryClient.setQueryData<Trainee[]>(["trainees"],
          previousTrainees.filter(t => t.id !== id)
        );
      }
      
      return { previousTrainees };
    },
    onSuccess: (id) => {
      // Xóa cache của trainee đó
      queryClient.removeQueries({ queryKey: ["trainee", id] });
      // Invalidate stage counts
      queryClient.invalidateQueries({ queryKey: ["trainee-stage-counts"] });
    },
    onError: (err, id, context) => {
      if (context?.previousTrainees) {
        queryClient.setQueryData(["trainees"], context.previousTrainees);
      }
    },
  });
}

/**
 * Hook khóa/mở khóa học viên - chỉ Primary Admin có quyền (RLS bảo vệ)
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
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      toast({
        title: data.is_locked ? "Đã khóa hồ sơ" : "Đã mở khóa hồ sơ",
        description: data.is_locked 
          ? "Chỉ Admin chính mới có thể chỉnh sửa hồ sơ này." 
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
