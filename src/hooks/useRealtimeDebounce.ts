import { useRef, useCallback } from 'react';
import { useQueryClient, QueryClient } from '@tanstack/react-query';

/**
 * REALTIME DEBOUNCE UTILITY
 * 
 * Tối ưu cho quy mô lớn: 1 triệu học viên + 100 users đồng thời
 * - Debounce 500ms để tránh query storm
 * - Gom nhiều events liên tiếp thành 1 lần refresh
 * - Targeted invalidation dựa trên queryKeys
 * 
 * QUY TẮC VÀNG #3: Scalability - Thiết kế cho hàng triệu records
 */

type QueryKeyGroup = readonly string[] | string[];
type DebouncedAction = {
  timer: NodeJS.Timeout | null;
  pendingKeys: Set<string>;
};

const DEBOUNCE_DELAY = 500; // ms

/**
 * Create a debounced realtime handler that batches multiple events
 */
export function createDebouncedRealtimeHandler(queryClient: QueryClient) {
  const actionMap = new Map<string, DebouncedAction>();

  /**
   * Queue invalidation for a group of query keys
   * Multiple rapid events will be batched into one refresh
   */
  const queueInvalidation = (
    groupId: string,
    queryKeys: readonly QueryKeyGroup[] | QueryKeyGroup[],
    forceRefetch: boolean = false
  ) => {
    let action = actionMap.get(groupId);
    
    if (!action) {
      action = { timer: null, pendingKeys: new Set() };
      actionMap.set(groupId, action);
    }

    // Add all keys to pending set
    queryKeys.forEach(key => action!.pendingKeys.add(JSON.stringify(key)));

    // Clear existing timer
    if (action.timer) {
      clearTimeout(action.timer);
    }

    // Set new timer
    action.timer = setTimeout(() => {
      console.log(`[RealtimeDebounce] Executing batch for "${groupId}" with ${action!.pendingKeys.size} keys`);
      
      // Process all pending keys
      action!.pendingKeys.forEach(keyStr => {
        const key = JSON.parse(keyStr) as string[];
        queryClient.invalidateQueries({ queryKey: key });
        
        if (forceRefetch) {
          queryClient.refetchQueries({ queryKey: key, type: "active" });
        }
      });

      // Clear pending
      action!.pendingKeys.clear();
      action!.timer = null;
    }, DEBOUNCE_DELAY);
  };

  /**
   * Targeted cache update for a specific record (optimistic)
   * Avoids full refetch by updating only the affected row
   */
  const updateCacheDirectly = <T extends { id: string }>(
    queryKey: string[],
    recordId: string,
    updater: (oldData: T[] | undefined) => T[] | undefined
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return updater(oldData);
    });
  };

  return {
    queueInvalidation,
    updateCacheDirectly,
  };
}

/**
 * React hook for debounced realtime handlers
 */
export function useRealtimeDebounce() {
  const queryClient = useQueryClient();
  const handlerRef = useRef<ReturnType<typeof createDebouncedRealtimeHandler> | null>(null);

  if (!handlerRef.current) {
    handlerRef.current = createDebouncedRealtimeHandler(queryClient);
  }

  const queueInvalidation = useCallback(
    (groupId: string, queryKeys: readonly QueryKeyGroup[] | QueryKeyGroup[], forceRefetch: boolean = false) => {
      handlerRef.current?.queueInvalidation(groupId, queryKeys, forceRefetch);
    },
    []
  );

  const updateCacheDirectly = useCallback(
    <T extends { id: string }>(
      queryKey: string[],
      recordId: string,
      updater: (oldData: T[] | undefined) => T[] | undefined
    ) => {
      handlerRef.current?.updateCacheDirectly(queryKey, recordId, updater);
    },
    []
  );

  return {
    queueInvalidation,
    updateCacheDirectly,
  };
}

/**
 * Predefined query key groups for common operations
 */
export const REALTIME_GROUPS = {
  TRAINEES: 'trainees',
  EDUCATION: 'education', 
  ORDERS: 'orders',
  PERMISSIONS: 'permissions',
  DASHBOARD: 'dashboard',
  DORMITORY: 'dormitory',
  POST_DEPARTURE: 'post-departure',
  PARTNERS: 'partners',
  LEGAL: 'legal',
  VIOLATIONS: 'violations',
} as const;

export const QUERY_KEY_BUNDLES = {
  trainees: [
    ["trainees"],
    ["trainee"],
    ["trainees-paginated"],
    ["trainee-stage-counts"],
    ["trainees-count"],
  ],
  traineesDashboard: [
    ["dashboard-trainees-raw"],
    ["dashboard-trainee-kpis"],
    ["dashboard-trainee-by-stage"],
    ["dashboard-trainee-by-status"],
    ["dashboard-trainee-by-type"],
    ["dashboard-trainee-monthly"],
    ["dashboard-trainee-by-source"],
    ["dashboard-trainee-by-birthplace"],
    ["dashboard-trainee-by-gender"],
    ["dashboard-trainee-departures-monthly"],
    ["dashboard-trainee-passed-monthly"],
  ],
  education: [
    ["classes"],
    ["teachers"],
    ["class-teachers"],
    ["test-scores"],
    ["test-names"],
    ["education-stats"],
    ["education-interview-stats"],
    ["absent-late-attendance"],
    ["class-students"],
    ["class-students-detailed"],
    ["available-trainees"],
  ],
  educationStats: [
    ["education-stats"],
    ["education-interview-stats"],
  ],
  permissions: [
    ["user-role"],
    ["users"],
    ["all-users"],
    ["all-users-with-roles"],
    ["admin-users"],
    ["is-primary-admin"],
    ["is-admin-check"],
    ["user-access-version"],
    ["menu-permissions"],
    ["effective-permissions"],
    ["user-permissions"],
    ["user-menu-permissions-direct"],
  ],
  orders: [
    ["orders"],
    ["order-trainee-counts"],
    ["order-trainees"],
    ["interview-history"],
    ["order-stats"],
  ],
  dormitory: [
    ["dormitories"],
    ["dormitories-with-count"],
    ["dormitory-residents"],
    ["dormitory-gender-stats"],
    ["available-trainees-for-dormitory"],
    ["trainees-in-other-dormitories"],
    ["trainee-dormitory-history"],
    ["search-trainee-dormitory"],
  ],
  postDeparture: [
    ["post-departure-trainees"],
    ["post-departure-stats-by-year"],
    ["post-departure-chart-data"],
    ["post-departure-by-type"],
    ["post-departure-kpi-cards"],
    ["contract-settlement-trainees"],
  ],
  partners: [
    ["companies"],
    ["unions"],
    ["job_categories"],
    ["company-trainee-counts"],
    ["union-trainee-counts"],
  ],
  legal: [
    ["legal-company-stats"],
    ["legal-summary-stats"],
    ["legal-trainee-type-stats"],
    ["legal-dkhd-stats"],
    ["legal-tpc-stats"],
    ["legal-trainees-by-type"],
    ["legal-company-trainees"],
  ],
  violations: [
    ["blacklist-entries"],
    ["blacklist"],
    ["trainee-reviews"],
  ],
} as const;
