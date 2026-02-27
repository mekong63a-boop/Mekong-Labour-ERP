import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  createDebouncedRealtimeHandler, 
  REALTIME_GROUPS, 
  QUERY_KEY_BUNDLES 
} from './useRealtimeDebounce';

/**
 * OPTIMIZED REALTIME HOOK - V2 (Debounced + Scalable)
 * 
 * QUY TẮC VÀNG #3: Thiết kế cho triệu records + 100 users đồng thời
 * 
 * Tối ưu hóa:
 * - Debounce 500ms để tránh Query Storm
 * - Gom nhiều events liên tiếp thành 1 batch refresh
 * - Targeted invalidation theo groups
 * 
 * Bảng được subscribe realtime:
 * - trainees: học viên (debounced)
 * - attendance: điểm danh
 * - education tables: classes, teachers, class_teachers, test_scores
 * - permissions: user_roles, menus, user_menu_permissions, department_menu_permissions
 * 
 * Bảng LỚN KHÔNG dùng realtime (dùng manual refresh):
 * - orders, companies, unions
 */
export function useSystemRealtime() {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceHandlerRef = useRef<ReturnType<typeof createDebouncedRealtimeHandler> | null>(null);

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (channelRef.current) {
      return;
    }

    // Initialize debounce handler
    if (!debounceHandlerRef.current) {
      debounceHandlerRef.current = createDebouncedRealtimeHandler(queryClient);
    }
    const { queueInvalidation } = debounceHandlerRef.current;

    const channelId = `system-realtime-debounced-${Date.now()}`;
    
    console.log('[Realtime] Starting debounced subscription (500ms batch)...');
    
    const channel = supabase
      .channel(channelId)
      
      // ========== TRAINEES (debounced - tránh query storm) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainees' },
        (payload) => {
          console.log('[Realtime] Trainee changed (queued):', payload.eventType);
          
          // Queue trainee-related invalidations (debounced 500ms)
          queueInvalidation(REALTIME_GROUPS.TRAINEES, QUERY_KEY_BUNDLES.trainees, true);
          
          // Queue dashboard invalidations
          queueInvalidation(REALTIME_GROUPS.DASHBOARD, QUERY_KEY_BUNDLES.traineesDashboard, false);
          
          // Queue education (class_id, progression_stage changes affect stats)
          queueInvalidation(REALTIME_GROUPS.EDUCATION, [
            ["classes"],
            ["class-students"],
            ["class-students-detailed"],
            ["available-trainees"],
            ["interview-stats"],
            ["education-interview-stats"], // Thống kê giáo dục
          ], true);
          
          // Queue dormitory (progression_stage changes affect stats - loại bỏ học viên xuất cảnh)
          queueInvalidation(REALTIME_GROUPS.DORMITORY, [
            ["dormitory-residents"],
            ["dormitories-with-count"],
            ["dormitory-gender-stats"],
          ], true);
          
          // Queue orders (receiving_company_id, progression_stage changes affect trainee counts)
          queueInvalidation(REALTIME_GROUPS.ORDERS, QUERY_KEY_BUNDLES.orders, false);
          
          // Queue post-departure (progression_stage changes affect departed trainee stats)
          queueInvalidation(REALTIME_GROUPS.POST_DEPARTURE, QUERY_KEY_BUNDLES.postDeparture, false);
          
          // Queue partners (receiving_company_id, union_id changes affect trainee counts)
          // TODO: Chuyển sang PostgreSQL View để tối ưu hiệu suất cho quy mô lớn
          queueInvalidation(REALTIME_GROUPS.PARTNERS, QUERY_KEY_BUNDLES.partners, false);
        }
      )
      
      // ========== INTERVIEW HISTORY (debounced) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interview_history' },
        (payload) => {
          console.log('[Realtime] Interview history changed (queued):', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.ORDERS, QUERY_KEY_BUNDLES.orders, false);
        }
      )
      
      // ========== ATTENDANCE (debounced) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log('[Realtime] Attendance changed (queued):', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.EDUCATION, [
            ["attendance"],
            ["absent-late-attendance"],
          ], true);
        }
      )

      // ========== EDUCATION TABLES (debounced) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classes' },
        (payload) => {
          console.log('[Realtime] Classes changed (queued):', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.EDUCATION, QUERY_KEY_BUNDLES.education, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teachers' },
        (payload) => {
          console.log('[Realtime] Teachers changed (queued):', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.EDUCATION, QUERY_KEY_BUNDLES.education, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_teachers' },
        (payload) => {
          console.log('[Realtime] Class teachers changed (queued):', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.EDUCATION, QUERY_KEY_BUNDLES.education, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'test_scores' },
        (payload) => {
          console.log('[Realtime] Test scores changed (queued):', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.EDUCATION, QUERY_KEY_BUNDLES.education, true);
        }
      )
      
      // ========== USER ROLES (immediate - critical for security) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        (payload) => {
          console.log('[Realtime] User roles changed:', payload.eventType);
          // Permissions are critical - use smaller debounce window
          queueInvalidation(REALTIME_GROUPS.PERMISSIONS, QUERY_KEY_BUNDLES.permissions, true);
        }
      )
      
      // ========== MENUS ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menus' },
        (payload) => {
          console.log('[Realtime] Menus changed:', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.PERMISSIONS, [
            ["menus"],
            ["menus-full"],
          ], true);
        }
      )
      
      // ========== USER MENU PERMISSIONS ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_menu_permissions' },
        (payload) => {
          console.log('[Realtime] User menu permissions changed:', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.PERMISSIONS, [
            ["menu-permissions"],
            ["effective-permissions"],
            ["user-permissions"],
            ["user-menu-permissions-direct"],
            ["user-access-version"],
            ["is-primary-admin"],
          ], true);
        }
      )
      
      // ========== DEPARTMENT MENU PERMISSIONS ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'department_menu_permissions' },
        (payload) => {
          console.log('[Realtime] Department menu permissions changed:', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.PERMISSIONS, [
            ["department-permissions"],
            ["effective-permissions"],
            ["user-menu-permissions-direct"],
          ], true);
        }
      )
      
      // ========== DEPARTMENT MEMBERS ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'department_members' },
        (payload) => {
          console.log('[Realtime] Department members changed:', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.PERMISSIONS, [
            ["department-members"],
            ["department-counts"],
            ["effective-permissions"],
            ["user-departments"],
          ], true);
        }
      )
      
      // ========== USER ACCESS VERSIONS ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_access_versions' },
        (payload) => {
          console.log('[Realtime] User access version changed:', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.PERMISSIONS, [
            ["user-access-version"],
            ["user-menu-permissions-direct"],
            ["is-primary-admin"],
          ], true);
        }
      )
      
      // ========== DORMITORY TABLES (debounced) ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dormitories' },
        (payload) => {
          console.log('[Realtime] Dormitories changed (queued):', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.DORMITORY, QUERY_KEY_BUNDLES.dormitory, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dormitory_residents' },
        (payload) => {
          console.log('[Realtime] Dormitory residents changed (queued):', payload.eventType);
          queueInvalidation(REALTIME_GROUPS.DORMITORY, QUERY_KEY_BUNDLES.dormitory, true);
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
    queryClient.invalidateQueries({ queryKey: ["trainees-paginated"] });
    queryClient.invalidateQueries({ queryKey: ["trainee-stage-counts"] });
    queryClient.invalidateQueries({ queryKey: ["trainees-count"] });
    queryClient.invalidateQueries({ queryKey: ["trainee"] });
    
    // Force immediate refetch for active queries
    queryClient.refetchQueries({ queryKey: ["trainees-paginated"], type: "active" });
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
    
    // Force immediate refetch
    queryClient.refetchQueries({ queryKey: ["dashboard-trainee-kpis"], type: "active" });
  };

  const refreshOrders = () => {
    console.log('[ManualRefresh] Refreshing orders...');
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["order-trainee-counts"] });
    queryClient.invalidateQueries({ queryKey: ["order-trainees"] });
    queryClient.invalidateQueries({ queryKey: ["interview-history"] });
    
    queryClient.refetchQueries({ queryKey: ["orders"], type: "active" });
  };

  const refreshPartners = () => {
    console.log('[ManualRefresh] Refreshing partners...');
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    queryClient.invalidateQueries({ queryKey: ["unions"] });
    queryClient.invalidateQueries({ queryKey: ["job_categories"] });
    
    queryClient.refetchQueries({ queryKey: ["companies"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["unions"], type: "active" });
  };

  const refreshEducation = () => {
    console.log('[ManualRefresh] Refreshing education...');
    queryClient.invalidateQueries({ queryKey: ["classes"] });
    queryClient.invalidateQueries({ queryKey: ["teachers"] });
    queryClient.invalidateQueries({ queryKey: ["class-students"] });
    queryClient.invalidateQueries({ queryKey: ["class-students-detailed"] });
    queryClient.invalidateQueries({ queryKey: ["available-trainees"] });
    queryClient.invalidateQueries({ queryKey: ["attendance"] });
    queryClient.invalidateQueries({ queryKey: ["test-scores"] });
    queryClient.invalidateQueries({ queryKey: ["education-stats"] });
    queryClient.invalidateQueries({ queryKey: ["education-interview-stats"] });
    queryClient.invalidateQueries({ queryKey: ["absent-late-attendance"] });

    // Force immediate refetch for active queries
    queryClient.refetchQueries({ queryKey: ["education-stats"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["education-interview-stats"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["classes"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["teachers"], type: "active" });
  };

  const refreshAll = () => {
    console.log('[ManualRefresh] Refreshing all data...');
    refreshTrainees();
    refreshDashboard();
    refreshOrders();
    refreshPartners();
    refreshEducation();
    
    // Internal Union
    queryClient.invalidateQueries({ queryKey: ["union-members"] });
    queryClient.invalidateQueries({ queryKey: ["union-transactions"] });
    
    // Glossary
    queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
    queryClient.invalidateQueries({ queryKey: ["katakana-names"] });
    queryClient.invalidateQueries({ queryKey: ["religions"] });
    queryClient.invalidateQueries({ queryKey: ["referral-sources"] });
    queryClient.invalidateQueries({ queryKey: ["policy-categories"] });
    
    // Dormitory - với force refetch
    queryClient.invalidateQueries({ queryKey: ["dormitories"] });
    queryClient.invalidateQueries({ queryKey: ["dormitories-with-count"] });
    queryClient.invalidateQueries({ queryKey: ["dormitory-residents"] });
    queryClient.invalidateQueries({ queryKey: ["dormitory-gender-stats"] });
    queryClient.invalidateQueries({ queryKey: ["available-trainees-for-dormitory"] });
    queryClient.invalidateQueries({ queryKey: ["trainees-in-other-dormitories"] });
    queryClient.refetchQueries({ queryKey: ["dormitories-with-count"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["dormitory-residents"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["dormitory-gender-stats"], type: "active" });
    
    // Handbook
    queryClient.invalidateQueries({ queryKey: ["handbook-entries"] });
    
    // Violations/Blacklist
    queryClient.invalidateQueries({ queryKey: ["blacklist"] });
    queryClient.invalidateQueries({ queryKey: ["trainee-reviews"] });
    
    // Permissions & Roles
    queryClient.invalidateQueries({ queryKey: ["menus"] });
    queryClient.invalidateQueries({ queryKey: ["menus-full"] });
    queryClient.invalidateQueries({ queryKey: ["user-role"] });
    queryClient.invalidateQueries({ queryKey: ["user-menu-permissions-direct"] });
    queryClient.invalidateQueries({ queryKey: ["user-access-version"] });
    queryClient.invalidateQueries({ queryKey: ["is-primary-admin"] });
    queryClient.invalidateQueries({ queryKey: ["effective-permissions"] });
    queryClient.invalidateQueries({ queryKey: ["menu-permissions"] });
    queryClient.invalidateQueries({ queryKey: ["all-users-with-roles"] });
    queryClient.invalidateQueries({ queryKey: ["department-permissions"] });
    queryClient.invalidateQueries({ queryKey: ["department-members"] });
    
    // Departments
    queryClient.invalidateQueries({ queryKey: ["departments"] });
    
    // Audit logs
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    
    // System monitoring
    queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
 */
export function useOrdersRealtime() {
  console.log('[Realtime] Orders realtime disabled - use manual refresh instead');
}

export function usePartnersRealtime() {
  console.log('[Realtime] Partners realtime disabled - use manual refresh instead');
}

export function useInternalUnionRealtime() {
  console.log('[Realtime] Internal union realtime disabled - use manual refresh instead');
}
