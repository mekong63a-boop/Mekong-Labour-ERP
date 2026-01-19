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
      // ========== TRAINEES (học viên - INSERT/UPDATE/DELETE) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainees' },
        (payload) => {
          console.log('[Realtime] Trainee changed:', payload.eventType);
          // Invalidate tất cả queries liên quan đến trainees
          queryClient.invalidateQueries({ queryKey: ["trainees"] });
          queryClient.invalidateQueries({ queryKey: ["trainee"] });
          queryClient.invalidateQueries({ queryKey: ["trainees-paginated"] });
          queryClient.invalidateQueries({ queryKey: ["trainee-stage-counts"] });
          queryClient.invalidateQueries({ queryKey: ["trainees-count"] });

          // Invalidate dashboard (đúng query keys đang dùng)
          queryClient.invalidateQueries({ queryKey: ["dashboard-trainees-raw"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-kpis"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-stage"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-status"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-type"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-monthly"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-source"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-birthplace"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-gender"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-departures-monthly"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-passed-monthly"] });
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
          // Invalidate tất cả query liên quan đến roles/permissions
          queryClient.invalidateQueries({ queryKey: ["user-role"] });
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["all-users"] });
          queryClient.invalidateQueries({ queryKey: ["all-users-with-roles"] });
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          queryClient.invalidateQueries({ queryKey: ["is-primary-admin"] });
          queryClient.invalidateQueries({ queryKey: ["is-admin-check"] });
          queryClient.invalidateQueries({ queryKey: ["user-access-version"] });
        }
      )
      // ========== MENUS (cấu trúc menu) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menus' },
        (payload) => {
          console.log('[Realtime] Menus changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["menus"] });
          queryClient.invalidateQueries({ queryKey: ["menus-full"] });
        }
      )
      // ========== USER MENU PERMISSIONS ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_menu_permissions' },
        (payload) => {
          console.log('[Realtime] User menu permissions changed:', payload.eventType);
          // Invalidate tất cả query liên quan đến permissions
          queryClient.invalidateQueries({ queryKey: ["menu-permissions"] });
          queryClient.invalidateQueries({ queryKey: ["effective-permissions"] });
          queryClient.invalidateQueries({ queryKey: ["user-permissions"] });
          queryClient.invalidateQueries({ queryKey: ["user-menu-permissions-direct"] });
          queryClient.invalidateQueries({ queryKey: ["user-access-version"] });
          queryClient.invalidateQueries({ queryKey: ["is-primary-admin"] });
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
          queryClient.invalidateQueries({ queryKey: ["user-menu-permissions-direct"] });
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
          queryClient.invalidateQueries({ queryKey: ["user-departments"] });
        }
      )
      // ========== USER ACCESS VERSIONS (quyền được thay đổi) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_access_versions' },
        (payload) => {
          console.log('[Realtime] User access version changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["user-access-version"] });
          queryClient.invalidateQueries({ queryKey: ["user-menu-permissions-direct"] });
          queryClient.invalidateQueries({ queryKey: ["is-primary-admin"] });
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
    queryClient.invalidateQueries({ queryKey: ["trainee"] });
  };

  const refreshDashboard = () => {
    console.log('[ManualRefresh] Refreshing dashboard...');
    queryClient.invalidateQueries({ queryKey: ["dashboard-trainees-raw"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-kpis"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-stage"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-status"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-type"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-monthly"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-source"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-birthplace"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-by-gender"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-departures-monthly"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trainee-passed-monthly"] });
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
    queryClient.invalidateQueries({ queryKey: ["attendance"] });
    queryClient.invalidateQueries({ queryKey: ["test-scores"] });
  };

  const refreshAll = () => {
    console.log('[ManualRefresh] Refreshing all data...');
    refreshTrainees();
    refreshDashboard();
    refreshOrders();
    refreshPartners();
    refreshEducation();
    queryClient.invalidateQueries({ queryKey: ["union-members"] });
    queryClient.invalidateQueries({ queryKey: ["union-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
    queryClient.invalidateQueries({ queryKey: ["menus-full"] });
    queryClient.invalidateQueries({ queryKey: ["user-menu-permissions-direct"] });
    queryClient.invalidateQueries({ queryKey: ["user-access-version"] });
    queryClient.invalidateQueries({ queryKey: ["is-primary-admin"] });
  };

  return {
    refreshTrainees,
    refreshDashboard,
    refreshOrders,
    refreshPartners,
    refreshEducation,
    refreshAll,
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
