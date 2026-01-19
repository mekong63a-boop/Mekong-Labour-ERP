import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useMemo } from 'react';

/**
 * =====================================================
 * QUY TẮC PHÂN QUYỀN MỚI - MEKONG LABOUR ERP
 * =====================================================
 * 
 * 1. NGUỒN QUYỀN DUY NHẤT: user_menu_permissions
 *    - Tất cả quyền đều lấy từ bảng này
 *    - RLS sử dụng function has_menu_permission() để kiểm tra
 * 
 * 2. ROLE (Admin/Staff/Senior Staff) chỉ là label mô tả
 *    - KHÔNG có quyền ngầm nào
 *    - NGOẠI LỆ DUY NHẤT: Primary Admin thấy tất cả
 * 
 * 3. Mapping bắt buộc:
 *    can_view   → Xem danh sách / chi tiết
 *    can_create → Thấy nút "Thêm"
 *    can_update → Thấy nút "Sửa"
 *    can_delete → Thấy nút "Xóa"
 * 
 * 4. KHÔNG TICK = KHÔNG TỒN TẠI (không render, không cho API)
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

/**
 * Realtime sync quyền menu.
 * Admin chỉnh quyền ở một trình duyệt → user khác F5 hoặc realtime cập nhật.
 */
function useMenuPermissionsRealtime(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ['is-primary-admin', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-menu-permissions-direct', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-access-version', userId] });
    };

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
        invalidateAll
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`,
        },
        invalidateAll
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
}

/**
 * Hook chính để lấy toàn bộ menu permissions của user hiện tại
 * Sử dụng user_menu_permissions - quyền theo tài khoản cá nhân
 */
export function useMenuPermissions() {
  const { user } = useAuth();

  // ★ Access version phải đứng đầu để đảm bảo hook order nhất quán
  // Realtime đã handle cập nhật quyền, không cần refetch khi focus
  const { data: accessVersion } = useQuery({
    queryKey: ['user-access-version', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_access_versions')
        .select('updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.warn('Error fetching access version:', error);
        return null;
      }
      return data?.updated_at ?? null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 phút - realtime sẽ invalidate nếu có thay đổi
    refetchOnWindowFocus: false, // KHÔNG refetch khi chuyển tab
  });

  // Realtime cập nhật quyền/phòng ban
  useMenuPermissionsRealtime(user?.id);

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
    staleTime: 5 * 60 * 1000,
  });

  // NOTE: isAdmin chỉ là label, KHÔNG có quyền ngầm nào
  // Giữ lại cho backward compatibility nếu UI cần hiển thị label
  const { data: isAdmin = false } = useQuery({
    queryKey: ['is-admin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc('is_admin_check', { _user_id: user.id });
      if (error) return false;
      return data ?? false;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Lấy danh sách tất cả menus (FULL fields cho sidebar)
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
    staleTime: 10 * 60 * 1000,
  });

  // Lấy quyền menu TRỰC TIẾP từ user_menu_permissions
  // Realtime đã handle cập nhật, không cần refetch khi focus
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['user-menu-permissions-direct', user?.id, accessVersion],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_menu_permissions')
        .select('menu_key, can_view, can_create, can_update, can_delete')
        .eq('user_id', user.id);
      if (error) {
        console.error('Error fetching user menu permissions:', error);
        return [];
      }
      return (data ?? []) as MenuPermission[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 phút - realtime sẽ invalidate nếu có thay đổi
    refetchOnWindowFocus: false, // KHÔNG refetch khi chuyển tab
  });

  // Build visible menus với hierarchy
  const visibleMenus = useMemo(() => {
    if (!menus.length) return [];
    
    // Primary Admin thấy tất cả
    if (isPrimaryAdmin) return menus;

    // User thường (kể cả admin phụ, staff, teacher): CHỈ thấy menu có quyền can_view
    // Nếu chưa được cấp quyền nào → không thấy menu nào
    const allowedKeys = new Set(
      permissions.filter(p => p.can_view).map(p => p.menu_key)
    );

    // Nếu không có quyền nào được cấp → trả về mảng rỗng
    if (allowedKeys.size === 0) return [];

    // Phải check cả parent menu
    const visibleSet = new Set<string>();
    
    menus.forEach(menu => {
      // Menu phải có quyền view
      if (allowedKeys.has(menu.key)) {
        visibleSet.add(menu.key);
        // Nếu có parent, thêm parent vào
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
    // CHỈ Primary Admin có tất cả quyền tự động
    if (isPrimaryAdmin) {
      return {
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      };
    }

    // Tất cả user khác (kể cả admin phụ) phải có quyền được cấp trong user_menu_permissions
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
 * NGUỒN SỰ THẬT: department_members table (quản lý qua DepartmentsContent)
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
    staleTime: 2 * 60 * 1000,
  });

  return { departments, isLoading };
}

/**
 * Hook lấy version quyền runtime của user hiện tại.
 * Bất kỳ thay đổi nào ở user_menu_permissions / user_permissions sẽ bump updated_at.
 */
export function useUserAccessVersion(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data } = useQuery({
    queryKey: ['user-access-version', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const { data, error } = await supabase
        .from('user_access_versions')
        .select('updated_at')
        .eq('user_id', targetUserId)
        .maybeSingle();
      if (error) {
        // Nếu chưa có row (user chưa từng được gán quyền) thì coi như null
        console.warn('Error fetching access version:', error);
        return null;
      }
      return data?.updated_at ?? null;
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 phút
    refetchOnWindowFocus: false, // KHÔNG refetch khi chuyển tab
  });

  return { data };
}

/**
 * @deprecated Không còn sử dụng - RLS giờ dựa trên user_menu_permissions
 * Giữ lại cho backward compatibility
 */
export function useUserDbPermissions() {
  return {
    dbPermissions: [],
    hasDbPermission: () => false,
    isLoading: false,
  };
}

/**
 * @deprecated Không còn sử dụng - Dùng useCanAction thay thế
 */
export function useHasDbPermission(_permissionCode: string) {
  return {
    hasPermission: false,
    isLoading: false,
  };
}
