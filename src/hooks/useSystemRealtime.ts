import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * OPTIMIZED REALTIME HOOK
 * 
 * Lắng nghe các bảng QUAN TRỌNG để tối ưu hiệu suất:
 * - trainees: học viên (chỉ UPDATE để invalidate cache)
 * - attendance: điểm danh realtime
 * - user_roles: phân quyền user
 * - menus: cấu trúc menu
 * - user_menu_permissions: quyền menu của user
 * - department_menu_permissions: quyền menu theo phòng ban
 * - department_members: thành viên phòng ban
 * 
 * CÁC BẢNG LỚN KHÁC (orders, companies, unions) 
 * KHÔNG dùng realtime để tiết kiệm tài nguyên.
 * Thay vào đó sử dụng refetch thủ công khi cần.
 */
export function useSystemRealtime() {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (channelRef.current) {
      return;
    }

    const channelId = `system-realtime-optimized-${Date.now()}`;
    
    console.log('[Realtime] Starting optimized subscription...');
    
    const channel = supabase
      .channel(channelId)
      // ========== TRAINEES (học viên - chỉ UPDATE) ==========
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trainees' },
        (payload) => {
          console.log('[Realtime] Trainee updated:', payload.new?.id || 'unknown');
          // Invalidate tất cả queries liên quan đến trainees
          queryClient.invalidateQueries({ queryKey: ["trainees"] });
          queryClient.invalidateQueries({ queryKey: ["trainee"] });
          queryClient.invalidateQueries({ queryKey: ["trainees-paginated"] });
          queryClient.invalidateQueries({ queryKey: ["trainee-stage-counts"] });
          queryClient.invalidateQueries({ queryKey: ["trainees-count"] });
          // Invalidate dashboard vì có thể ảnh hưởng thống kê
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
        }
      )
      // ========== ATTENDANCE (điểm danh realtime) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log('[Realtime] Attendance changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["attendance"] });
        }
      )
      // ========== USER ROLES (phân quyền - RẤT QUAN TRỌNG) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        (payload) => {
          console.log('[Realtime] User roles changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["user-role"] });
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["all-users"] });
        }
      )
      // ========== MENUS (cấu trúc menu) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menus' },
        (payload) => {
          console.log('[Realtime] Menus changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["menus"] });
        }
      )
      // ========== USER MENU PERMISSIONS ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_menu_permissions' },
        (payload) => {
          console.log('[Realtime] User menu permissions changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["menu-permissions"] });
          queryClient.invalidateQueries({ queryKey: ["effective-permissions"] });
          queryClient.invalidateQueries({ queryKey: ["user-permissions"] });
        }
      )
      // ========== DEPARTMENT MENU PERMISSIONS ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'department_menu_permissions' },
        (payload) => {
          console.log('[Realtime] Department menu permissions changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["department-permissions"] });
          queryClient.invalidateQueries({ queryKey: ["effective-permissions"] });
        }
      )
      // ========== DEPARTMENT MEMBERS ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'department_members' },
        (payload) => {
          console.log('[Realtime] Department members changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["department-members"] });
          queryClient.invalidateQueries({ queryKey: ["department-counts"] });
          queryClient.invalidateQueries({ queryKey: ["effective-permissions"] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] System subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('[Realtime] Cleaning up system channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);
}

/**
 * Hook để refresh data thủ công cho các bảng lớn
 * Sử dụng khi user muốn lấy data mới nhất
 */
export function useManualRefresh() {
  const queryClient = useQueryClient();

  const refreshTrainees = () => {
    console.log('[ManualRefresh] Refreshing trainees...');
    queryClient.invalidateQueries({ queryKey: ["trainees"] });
    queryClient.invalidateQueries({ queryKey: ["trainees-paginated"] });
    queryClient.invalidateQueries({ queryKey: ["trainee-stage-counts"] });
    queryClient.invalidateQueries({ queryKey: ["trainees-count"] });
  };

  const refreshOrders = () => {
    console.log('[ManualRefresh] Refreshing orders...');
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const refreshPartners = () => {
    console.log('[ManualRefresh] Refreshing partners...');
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    queryClient.invalidateQueries({ queryKey: ["unions"] });
    queryClient.invalidateQueries({ queryKey: ["job_categories"] });
  };

  const refreshEducation = () => {
    console.log('[ManualRefresh] Refreshing education...');
    queryClient.invalidateQueries({ queryKey: ["classes"] });
    queryClient.invalidateQueries({ queryKey: ["teachers"] });
    queryClient.invalidateQueries({ queryKey: ["class-students"] });
  };

  const refreshAll = () => {
    console.log('[ManualRefresh] Refreshing all data...');
    refreshTrainees();
    refreshOrders();
    refreshPartners();
    refreshEducation();
    queryClient.invalidateQueries({ queryKey: ["union-members"] });
    queryClient.invalidateQueries({ queryKey: ["union-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
  };

  return {
    refreshTrainees,
    refreshOrders,
    refreshPartners,
    refreshEducation,
    refreshAll
  };
}

/**
 * DEPRECATED: Các hook cũ vẫn giữ lại để tương thích ngược
 * Nhưng không còn tự động subscribe realtime cho bảng lớn
 */
export function useOrdersRealtime() {
  // Không còn realtime cho orders - sử dụng useManualRefresh().refreshOrders() thay thế
  console.log('[Realtime] Orders realtime disabled - use manual refresh instead');
}

export function usePartnersRealtime() {
  // Không còn realtime cho partners - sử dụng useManualRefresh().refreshPartners() thay thế
  console.log('[Realtime] Partners realtime disabled - use manual refresh instead');
}

export function useInternalUnionRealtime() {
  // Không còn realtime cho internal union - sử dụng manual refresh thay thế
  console.log('[Realtime] Internal Union realtime disabled - use manual refresh instead');
}

export function useGlossaryRealtime() {
  // Không còn realtime cho glossary - sử dụng manual refresh thay thế
  console.log('[Realtime] Glossary realtime disabled - use manual refresh instead');
}
