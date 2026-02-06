import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMenuPermissions } from "./useMenuPermissions";
import { useEffect } from "react";

export interface PendingRegistration {
  id: string;
  user_id: string;
  user_email: string;
  full_name: string | null;
  registered_at: string;
  is_read: boolean;
}

/**
 * Hook để lấy danh sách đăng ký chờ phân quyền
 * CHỈ Primary Admin mới có thể xem
 */
export function usePendingRegistrations() {
  const { isPrimaryAdmin } = useMenuPermissions();
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading, refetch } = useQuery({
    queryKey: ["pending-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_registrations")
        .select("*")
        .order("registered_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending registrations:", error);
        return [];
      }
      return data as PendingRegistration[];
    },
    enabled: isPrimaryAdmin,
    staleTime: 1000 * 60 * 5, // 5 phút
  });

  // Realtime subscription cho pending_registrations
  useEffect(() => {
    if (!isPrimaryAdmin) return;

    const channel = supabase
      .channel("pending-registrations-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pending_registrations",
        },
        () => {
          // Refetch khi có thay đổi
          queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
          queryClient.invalidateQueries({ queryKey: ["pending-registration-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isPrimaryAdmin, queryClient]);

  const unreadCount = registrations.filter((r) => !r.is_read).length;

  return {
    registrations,
    unreadCount,
    isLoading,
    refetch,
    isPrimaryAdmin,
  };
}

/**
 * Hook để lấy số lượng đăng ký chưa đọc
 */
export function usePendingRegistrationCount() {
  const { isPrimaryAdmin } = useMenuPermissions();

  const { data: count = 0 } = useQuery({
    queryKey: ["pending-registration-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pending_registration_count");
      if (error) {
        console.error("Error fetching pending count:", error);
        return 0;
      }
      return data ?? 0;
    },
    enabled: isPrimaryAdmin,
    staleTime: 1000 * 30, // 30 giây
    refetchInterval: 1000 * 60, // Refetch mỗi phút
  });

  return { count, isPrimaryAdmin };
}

/**
 * Hook để đánh dấu đã đọc
 */
export function useMarkRegistrationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from("pending_registrations")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", registrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["pending-registration-count"] });
    },
  });
}

/**
 * Hook để xóa pending registration (sau khi đã cấp quyền)
 */
export function useDeletePendingRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("pending_registrations")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["pending-registration-count"] });
    },
  });
}
