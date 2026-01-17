import { useAuth, AppRole } from "./useAuth";
import { useState, useEffect } from "react";
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
 */
export function useUserRoleStandalone(): UseUserRoleResult {
  const [roleData, setRoleData] = useState<UserRoleData>({
    role: null,
    is_primary_admin: false,
    is_senior_staff: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRoleData({ role: null, is_primary_admin: false, is_senior_staff: false });
          setUserId(null);
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("user_roles")
          .select("role, is_primary_admin, is_senior_staff")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRoleData({ role: null, is_primary_admin: false, is_senior_staff: false });
        } else if (data) {
          setRoleData({
            role: data.role as AppRole,
            is_primary_admin: data.is_primary_admin || false,
            is_senior_staff: data.is_senior_staff || false,
          });
        } else {
          setRoleData({ role: null, is_primary_admin: false, is_senior_staff: false });
        }
      } catch (error) {
        console.error("Error in useUserRole:", error);
        setRoleData({ role: null, is_primary_admin: false, is_senior_staff: false });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const { role, is_primary_admin, is_senior_staff } = roleData;
  
  const isPrimaryAdmin = role === "admin" && is_primary_admin;
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const isSeniorStaff = is_senior_staff;
  const canViewSensitiveData = isAdmin || isSeniorStaff;

  // Business logic permissions - chỉ admin mới có quyền xóa
  const canDelete = isAdmin;
  const canManageUsers = isAdmin;
  const canAssignAdmins = isPrimaryAdmin; // Only primary admin can assign admin roles

  return {
    role,
    isPrimaryAdmin,
    isAdmin,
    isStaff,
    isSeniorStaff,
    canViewSensitiveData,
    isLoading,
    userId,
    canDelete,
    canManageUsers,
    canAssignAdmins,
  };
}

/**
 * Hook that uses the AuthProvider context
 */
export function useUserRole(): UseUserRoleResult {
  const [roleData, setRoleData] = useState<UserRoleData>({
    role: null,
    is_primary_admin: false,
    is_senior_staff: false,
  });
  const [extraLoading, setExtraLoading] = useState(true);
  
  let user: any = null;
  let role: AppRole | null = null;
  let isLoading = true;
  let isSeniorStaffFromAuth = false;
  
  try {
    const authResult = useAuth();
    user = authResult.user;
    role = authResult.role;
    isLoading = authResult.isLoading;
    isSeniorStaffFromAuth = authResult.isSeniorStaff;
  } catch {
    // If not within AuthProvider, use standalone version
    return useUserRoleStandalone();
  }

  useEffect(() => {
    const fetchExtraRoleData = async () => {
      if (!user?.id) {
        setRoleData({ role: null, is_primary_admin: false, is_senior_staff: false });
        setExtraLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("is_primary_admin, is_senior_staff")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching extra role data:", error);
        } else if (data) {
          setRoleData({
            role,
            is_primary_admin: data.is_primary_admin || false,
            is_senior_staff: data.is_senior_staff || false,
          });
        }
      } catch (error) {
        console.error("Error in useUserRole extra fetch:", error);
      } finally {
        setExtraLoading(false);
      }
    };

    fetchExtraRoleData();
  }, [user?.id, role]);

  const isPrimaryAdmin = role === "admin" && roleData.is_primary_admin;
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const isSeniorStaff = roleData.is_senior_staff || isSeniorStaffFromAuth;
  const canViewSensitiveData = isAdmin || isSeniorStaff;

  // Business logic permissions - chỉ admin mới có quyền xóa
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
    isLoading: isLoading || extraLoading,
    userId: user?.id ?? null,
    canDelete,
    canManageUsers,
    canAssignAdmins,
  };
}
