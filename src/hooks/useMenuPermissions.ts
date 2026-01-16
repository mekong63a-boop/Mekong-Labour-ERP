import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

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

/**
 * Hook chính để lấy toàn bộ menu permissions của user hiện tại
 */
export function useMenuPermissions() {
  const { user } = useAuth();

  // Kiểm tra Primary Admin
  const { data: isPrimaryAdmin = false, isLoading: isPrimaryAdminLoading } = useQuery({
    queryKey: ['is-primary-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc('is_primary_admin_check', { _user_id: user.id });
      if (error) {
        console.error('Error checking primary admin:', error);
        return false;
      }
      return data ?? false;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  // Kiểm tra Admin
  const { data: isAdmin = false, isLoading: isAdminLoading } = useQuery({
    queryKey: ['is-admin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc('is_admin_check', { _user_id: user.id });
      if (error) {
        console.error('Error checking admin:', error);
        return false;
      }
      return data ?? false;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Lấy danh sách tất cả menus
  const { data: menus = [], isLoading: menusLoading } = useQuery({
    queryKey: ['menus'],
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
    staleTime: 10 * 60 * 1000, // Cache 10 minutes - menus rarely change
  });

  // Lấy permissions của user
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['user-menu-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.rpc('get_user_menu_permissions', { _user_id: user.id });
      if (error) {
        console.error('Error fetching menu permissions:', error);
        return [];
      }
      return (data ?? []) as MenuPermission[];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // Cache 2 minutes
  });

  // Build visible menus với hierarchy
  const visibleMenus = useMemo(() => {
    if (!menus.length) return [];
    
    // Primary Admin thấy tất cả
    if (isPrimaryAdmin) return menus;

    // Lọc menus dựa trên can_view
    const allowedKeys = new Set(
      permissions.filter(p => p.can_view).map(p => p.menu_key)
    );

    // Phải check cả parent menu
    return menus.filter(menu => {
      // Menu phải có quyền view
      if (!allowedKeys.has(menu.key)) return false;
      
      // Nếu có parent, parent cũng phải visible
      if (menu.parent_key && !allowedKeys.has(menu.parent_key)) {
        return false;
      }
      
      return true;
    });
  }, [menus, permissions, isPrimaryAdmin]);

  const isLoading = isPrimaryAdminLoading || isAdminLoading || menusLoading || permissionsLoading;

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
    // Primary Admin có tất cả quyền
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
 * Hook để lấy permissions cho một user khác (Admin dùng)
 */
export function useUserMenuPermissions(targetUserId: string | undefined) {
  const { isAdmin, isPrimaryAdmin } = useMenuPermissions();

  const { data: permissions = [], isLoading, refetch } = useQuery({
    queryKey: ['target-user-permissions', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data, error } = await supabase
        .from('user_menu_permissions')
        .select('*')
        .eq('user_id', targetUserId);
      if (error) {
        console.error('Error fetching target user permissions:', error);
        return [];
      }
      return data;
    },
    enabled: !!targetUserId && (isAdmin || isPrimaryAdmin),
  });

  return { permissions, isLoading, refetch };
}
