import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMenuPermissions } from "./useMenuPermissions";

export interface PendingUser {
  user_id: string;
  user_email: string;
  full_name: string | null;
  email_confirmed_at: string;
  created_at: string;
}

/**
 * Hook để lấy danh sách user đã xác thực email nhưng chưa có role
 * CHỈ Primary Admin mới có thể xem
 */
export function usePendingRegistrations() {
  const { isPrimaryAdmin } = useMenuPermissions();

  const { data: registrations = [], isLoading, refetch } = useQuery({
    queryKey: ["pending-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pending_users");

      if (error) {
        console.error("Error fetching pending users:", error);
        return [];
      }
      return data as PendingUser[];
    },
    enabled: isPrimaryAdmin,
    staleTime: 1000 * 30, // 30 giây
    refetchInterval: 1000 * 60, // Refetch mỗi phút để cập nhật realtime
  });

  return {
    registrations,
    unreadCount: registrations.length,
    isLoading,
    refetch,
    isPrimaryAdmin,
  };
}

/**
 * Hook để lấy số lượng user chờ cấp quyền
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
