import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useMemo, useRef } from 'react';

/**
 * =====================================================
 * SYSTEM FIX - PHÂN QUYỀN MEKONG LABOUR ERP
 * =====================================================
 * 
 * QUY TẮC BẮT BUỘC:
 * 1. Permission CHỈ load 1 lần sau login (staleTime: Infinity)
 * 2. KHÔNG refetch khi:
 *    - visibilitychange
 *    - refocus tab
 *    - realtime invalidate (chỉ update state inline)
 * 3. Permission loading KHÔNG block UI
 * 4. Realtime chỉ cập nhật STATE - không gọi invalidateQueries
 * 
 * NGUỒN QUYỀN DUY NHẤT: user_menu_permissions
 * NGOẠI LỆ DUY NHẤT: Primary Admin thấy tất cả
 * =====================================================
 */

export interface MenuPermission {
  menu_key: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface Menu {
  key: string;
  label: string;
  parent_key: string | null;
  path: string;
  icon: string | null;
  order_index: number;
}

// ★ Flag đảm bảo permission chỉ load 1 lần per session
const permissionLoadedMap = new Map<string, boolean>();

/**
 * Realtime sync quyền menu - CHỈ UPDATE STATE, KHÔNG INVALIDATE
 */
function useMenuPermissionsRealtime(
  userId: string | undefined,
  setPermissionsInline: (updater: (prev: MenuPermission[]) => MenuPermission[]) => void,
  setIsPrimaryAdminInline: (value: boolean) => void
) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user_permissions_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_menu_permissions',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // ★ CHỈ UPDATE STATE INLINE - KHÔNG GỌI invalidateQueries
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newPerm = payload.new as MenuPermission & { user_id: string };
            setPermissionsInline((prev) => {
              const exists = prev.findIndex(p => p.menu_key === newPerm.menu_key);
              if (exists >= 0) {
                const updated = [...prev];
                updated[exists] = {
                  menu_key: newPerm.menu_key,
                  can_view: newPerm.can_view,
                  can_create: newPerm.can_create,
                  can_update: newPerm.can_update,
                  can_delete: newPerm.can_delete,
                };
                return updated;
              }
              return [...prev, {
                menu_key: newPerm.menu_key,
                can_view: newPerm.can_view,
                can_create: newPerm.can_create,
                can_update: newPerm.can_update,
                can_delete: newPerm.can_delete,
              }];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldPerm = payload.old as { menu_key: string };
            setPermissionsInline((prev) => prev.filter(p => p.menu_key !== oldPerm.menu_key));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Reload primary admin status nếu role thay đổi
          const { data } = await supabase.rpc('is_primary_admin_check', { _user_id: userId });
          setIsPrimaryAdminInline(data ?? false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, setPermissionsInline, setIsPrimaryAdminInline]);
}

/**
 * Hook chính để lấy toàn bộ menu permissions của user hiện tại
 */
export function useMenuPermissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // ★ Inline state cho realtime updates - không gây re-render toàn bộ
  const permissionsRef = useRef<MenuPermission[]>([]);
  const isPrimaryAdminRef = useRef<boolean>(false);

  // Kiểm tra Primary Admin - CHỈ LOAD 1 LẦN
  const { data: isPrimaryAdmin = false, isLoading: isPrimaryAdminLoading } = useQuery({
    queryKey: ['is-primary-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      // ★ Nếu đã load rồi, dùng cache
      if (permissionLoadedMap.get(`primary-admin-${user.id}`)) {
        return isPrimaryAdminRef.current;
      }
      
      const { data, error } = await supabase.rpc('is_primary_admin_check', { _user_id: user.id });
      if (error) {
        console.error('Error checking primary admin:', error);
        return false;
      }
      
      isPrimaryAdminRef.current = data ?? false;
      permissionLoadedMap.set(`primary-admin-${user.id}`, true);
      return data ?? false;
    },
    enabled: !!user?.id,
    staleTime: Infinity, // ★ KHÔNG BAO GIỜ stale
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // isAdmin label
  const { data: isAdmin = false } = useQuery({
    queryKey: ['is-admin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc('is_admin_check', { _user_id: user.id });
      if (error) return false;
      return data ?? false;
    },
    enabled: !!user?.id,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Lấy danh sách tất cả menus - CHỈ LOAD 1 LẦN
  const { data: menus = [], isLoading: menusLoading } = useQuery({
    queryKey: ['menus-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('order_index');
      if (error) {
        console.error('Error fetching menus:', error);
        return [];
      }
      return data as Menu[];
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Lấy quyền menu - CHỈ LOAD 1 LẦN SAU LOGIN
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['user-menu-permissions-direct', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // ★ Nếu đã load rồi, dùng cache
      if (permissionLoadedMap.get(`permissions-${user.id}`)) {
        return permissionsRef.current;
      }
      
      const { data, error } = await supabase
        .from('user_menu_permissions')
        .select('menu_key, can_view, can_create, can_update, can_delete')
        .eq('user_id', user.id);
      if (error) {
        console.error('Error fetching user menu permissions:', error);
        return [];
      }
      
      const perms = (data ?? []) as MenuPermission[];
      permissionsRef.current = perms;
      permissionLoadedMap.set(`permissions-${user.id}`, true);
      return perms;
    },
    enabled: !!user?.id,
    staleTime: Infinity, // ★ KHÔNG BAO GIỜ stale
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // ★ Inline setters cho realtime - update cache trực tiếp
  const setPermissionsInline = (updater: (prev: MenuPermission[]) => MenuPermission[]) => {
    const newPerms = updater(permissionsRef.current);
    permissionsRef.current = newPerms;
    queryClient.setQueryData(['user-menu-permissions-direct', user?.id], newPerms);
  };
  
  const setIsPrimaryAdminInline = (value: boolean) => {
    isPrimaryAdminRef.current = value;
    queryClient.setQueryData(['is-primary-admin', user?.id], value);
  };

  // Realtime - CHỈ UPDATE STATE, KHÔNG INVALIDATE
  useMenuPermissionsRealtime(user?.id, setPermissionsInline, setIsPrimaryAdminInline);

  // Build visible menus với hierarchy
  const visibleMenus = useMemo(() => {
    if (!menus.length) return [];
    
    // Primary Admin thấy tất cả
    if (isPrimaryAdmin) return menus;

    const allowedKeys = new Set(
      permissions.filter(p => p.can_view).map(p => p.menu_key)
    );

    if (allowedKeys.size === 0) return [];

    const visibleSet = new Set<string>();
    
    menus.forEach(menu => {
      if (allowedKeys.has(menu.key)) {
        visibleSet.add(menu.key);
        if (menu.parent_key) {
          visibleSet.add(menu.parent_key);
        }
      }
    });

    return menus.filter(menu => visibleSet.has(menu.key));
  }, [menus, permissions, isPrimaryAdmin]);

  const isLoading = isPrimaryAdminLoading || menusLoading || permissionsLoading;

  return {
    menus,
    permissions,
    visibleMenus,
    isPrimaryAdmin,
    isAdmin,
    isLoading,
    userId: user?.id,
  };
}

/**
 * Hook kiểm tra quyền truy cập một menu cụ thể
 */
export function useCanAccessMenu(menuKey: string) {
  const { permissions, isPrimaryAdmin, isLoading } = useMenuPermissions();

  const permission = useMemo(() => {
    if (isPrimaryAdmin) {
      return {
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      };
    }

    const found = permissions.find(p => p.menu_key === menuKey);
    return {
      canView: found?.can_view ?? false,
      canCreate: found?.can_create ?? false,
      canUpdate: found?.can_update ?? false,
      canDelete: found?.can_delete ?? false,
    };
  }, [permissions, menuKey, isPrimaryAdmin]);

  return {
    ...permission,
    isLoading,
    isPrimaryAdmin,
  };
}

/**
 * Hook kiểm tra một action cụ thể trên một menu
 */
export function useCanAction(menuKey: string, action: 'view' | 'create' | 'update' | 'delete') {
  const { canView, canCreate, canUpdate, canDelete, isLoading, isPrimaryAdmin } = useCanAccessMenu(menuKey);

  const hasPermission = useMemo(() => {
    if (isPrimaryAdmin) return true;
    
    switch (action) {
      case 'view': return canView;
      case 'create': return canCreate;
      case 'update': return canUpdate;
      case 'delete': return canDelete;
      default: return false;
    }
  }, [action, canView, canCreate, canUpdate, canDelete, isPrimaryAdmin]);

  return { hasPermission, isLoading };
}

/**
 * Hook lấy danh sách phòng ban user thuộc về
 */
export function useUserDepartments(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['user-departments', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data, error } = await supabase
        .from('department_members')
        .select('department, role_in_department')
        .eq('user_id', targetUserId);
      if (error) {
        console.error('Error fetching user departments:', error);
        return [];
      }
      return data;
    },
    enabled: !!targetUserId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return { departments, isLoading };
}

/**
 * Hook lấy version quyền runtime - KHÔNG CÒN SỬ DỤNG CHO INVALIDATE
 */
export function useUserAccessVersion(userId?: string) {
  return { data: null };
}

/**
 * @deprecated Không còn sử dụng
 */
export function useUserDbPermissions() {
  return {
    dbPermissions: [],
    hasDbPermission: () => false,
    isLoading: false,
  };
}

/**
 * @deprecated Dùng useCanAction thay thế
 */
export function useHasDbPermission(_permissionCode: string) {
  return {
    hasPermission: false,
    isLoading: false,
  };
}

/**
 * ★ RESET permission cache khi logout
 * Gọi function này khi user signOut
 */
export function resetPermissionCache(userId?: string) {
  if (userId) {
    permissionLoadedMap.delete(`primary-admin-${userId}`);
    permissionLoadedMap.delete(`permissions-${userId}`);
  } else {
    permissionLoadedMap.clear();
  }
}
