import { useAuth, AppRole } from "./useAuth";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * useUserRole - Hook lấy thông tin vai trò hệ thống của user
 * 
 * 3 QUYỀN HỆ THỐNG:
 * - Admin (role='admin'): Toàn quyền, xem dữ liệu nhạy cảm
 * - Nhân viên cấp cao (role='staff' AND is_senior_staff=true): Xem dữ liệu nhạy cảm
 * - Nhân viên (role='staff' AND is_senior_staff=false): Chỉ xem dữ liệu đã mask
 * 
 * CHỈ DÙNG CHO:
 * - Kiểm tra vai trò hệ thống (Admin/Staff)
 * - Business logic: canDelete, same-day edit rule
 * - isPrimaryAdmin check
 * 
 * KHÔNG DÙNG CHO:
 * - Quyền menu (dùng useMenuPermissions)
 * - Phòng ban (dùng department_members qua DepartmentsContent)
 */

interface UserRoleData {
  role: AppRole | null;
  is_primary_admin: boolean;
  is_senior_staff: boolean;
}

interface UseUserRoleResult {
  role: AppRole | null;
  isPrimaryAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isSeniorStaff: boolean;
  canViewSensitiveData: boolean;
  isLoading: boolean;
  userId: string | null;
  // Business logic helpers
  canDelete: boolean;
  canManageUsers: boolean;
  canAssignAdmins: boolean;
}

/**
 * Standalone hook that doesn't require AuthProvider context
 * Sử dụng react-query để cache và tránh re-fetch khi chuyển tab
 */
export function useUserRoleStandalone(): UseUserRoleResult {
  const [userId, setUserId] = useState<string | null | undefined>(undefined); // undefined = chưa init
  const initializedRef = useRef(false);

  // Lấy user ID một lần duy nhất khi mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null); // null = không có user, string = có user
    };
    getUser();

    // CHỈ listen auth change cho SIGN_OUT/SIGN_IN events thực sự
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Chỉ update khi có thay đổi user thực sự (login/logout)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setUserId(session?.user?.id ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ★ SYSTEM FIX: staleTime: Infinity, load 1 lần duy nhất
  const { data: roleData, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role-standalone', userId],
    queryFn: async (): Promise<UserRoleData> => {
      if (!userId) {
        return { role: null, is_primary_admin: false, is_senior_staff: false };
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role, is_primary_admin, is_senior_staff")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return { role: null, is_primary_admin: false, is_senior_staff: false };
      }

      return {
        role: (data?.role as AppRole) ?? null,
        is_primary_admin: data?.is_primary_admin ?? false,
        is_senior_staff: data?.is_senior_staff ?? false,
      };
    },
    enabled: userId !== undefined && userId !== null,
    staleTime: Infinity, // ★ KHÔNG BAO GIỜ stale
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { role, is_primary_admin, is_senior_staff } = roleData ?? { role: null, is_primary_admin: false, is_senior_staff: false };
  
  const isPrimaryAdmin = role === "admin" && is_primary_admin;
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const isSeniorStaff = is_senior_staff;
  const canViewSensitiveData = isAdmin || isSeniorStaff;

  /**
   * @deprecated canDelete - KHÔNG SỬ DỤNG CHO UI RENDER
   * Sử dụng useCanAction(menuKey, 'delete') từ useMenuPermissions thay thế.
   * Property này chỉ giữ lại cho backward compatibility.
   */
  const canDelete = isAdmin;
  const canManageUsers = isAdmin;
  const canAssignAdmins = isPrimaryAdmin; // Only primary admin can assign admin roles

  // isLoading: chỉ loading khi userId chưa được init (undefined) hoặc đang fetch role
  // Nếu userId = null (không có user) thì không cần loading
  const isLoading = userId === undefined || (userId !== null && roleLoading);

  return {
    role,
    isPrimaryAdmin,
    isAdmin,
    isStaff,
    isSeniorStaff,
    canViewSensitiveData,
    isLoading,
    userId: userId ?? null,
    canDelete,
    canManageUsers,
    canAssignAdmins,
  };
}

/**
 * Hook that uses the AuthProvider context
 * Sử dụng react-query để cache và tránh re-fetch khi chuyển tab
 */
export function useUserRole(): UseUserRoleResult {
  let user: any = null;
  let role: AppRole | null = null;
  let isAuthLoading = true;
  let isSeniorStaffFromAuth = false;
  
  try {
    const authResult = useAuth();
    user = authResult.user;
    role = authResult.role;
    isAuthLoading = authResult.isLoading;
    isSeniorStaffFromAuth = authResult.isSeniorStaff;
  } catch {
    // If not within AuthProvider, use standalone version
    return useUserRoleStandalone();
  }

  // ★ SYSTEM FIX: staleTime: Infinity, load 1 lần duy nhất
  const { data: extraRoleData, isLoading: extraLoading } = useQuery({
    queryKey: ['user-role-extra', user?.id],
    queryFn: async (): Promise<{ is_primary_admin: boolean; is_senior_staff: boolean }> => {
      if (!user?.id) {
        return { is_primary_admin: false, is_senior_staff: false };
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("is_primary_admin, is_senior_staff")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching extra role data:", error);
        return { is_primary_admin: false, is_senior_staff: false };
      }

      return {
        is_primary_admin: data?.is_primary_admin ?? false,
        is_senior_staff: data?.is_senior_staff ?? false,
      };
    },
    enabled: !!user?.id,
    staleTime: Infinity, // ★ KHÔNG BAO GIỜ stale
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const isPrimaryAdmin = role === "admin" && (extraRoleData?.is_primary_admin ?? false);
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const isSeniorStaff = (extraRoleData?.is_senior_staff ?? false) || isSeniorStaffFromAuth;
  const canViewSensitiveData = isAdmin || isSeniorStaff;

  const canDelete = isAdmin;
  const canManageUsers = isAdmin;
  const canAssignAdmins = isPrimaryAdmin;

  return {
    role,
    isPrimaryAdmin,
    isAdmin,
    isStaff,
    isSeniorStaff,
    canViewSensitiveData,
    isLoading: isAuthLoading || extraLoading,
    userId: user?.id ?? null,
    canDelete,
    canManageUsers,
    canAssignAdmins,
  };
}
