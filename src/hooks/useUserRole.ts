import { useAuth, AppRole } from "./useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useUserRole - Hook lấy thông tin vai trò hệ thống của user
 * 
 * CHỈ DÙNG CHO:
 * - Kiểm tra vai trò hệ thống (Admin/Manager/Staff/Teacher)
 * - Business logic: canDelete, canEditSensitiveFields, same-day edit rule
 * - isPrimaryAdmin check
 * 
 * KHÔNG DÙNG CHO:
 * - Quyền menu (dùng useMenuPermissions)
 * - Phòng ban (dùng department_members qua DepartmentsContent)
 */

interface UserRoleData {
  role: AppRole | null;
  is_primary_admin: boolean;
}

interface UseUserRoleResult {
  role: AppRole | null;
  isPrimaryAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  isTeacher: boolean;
  isLoading: boolean;
  userId: string | null;
  // Business logic helpers - vẫn cần thiết
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
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRoleData({ role: null, is_primary_admin: false });
          setUserId(null);
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("user_roles")
          .select("role, is_primary_admin")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRoleData({ role: null, is_primary_admin: false });
        } else if (data) {
          setRoleData({
            role: data.role as AppRole,
            is_primary_admin: data.is_primary_admin || false,
          });
        } else {
          setRoleData({ role: null, is_primary_admin: false });
        }
      } catch (error) {
        console.error("Error in useUserRole:", error);
        setRoleData({ role: null, is_primary_admin: false });
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

  const { role, is_primary_admin } = roleData;
  
  const isPrimaryAdmin = role === "admin" && is_primary_admin;
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isStaff = role === "staff";
  const isTeacher = role === "teacher";

  // Business logic permissions
  const canDelete = isAdmin || isManager; // Staff cannot delete
  const canManageUsers = isAdmin;
  const canAssignAdmins = isPrimaryAdmin; // Only primary admin can assign admin roles

  return {
    role,
    isPrimaryAdmin,
    isAdmin,
    isManager,
    isStaff,
    isTeacher,
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
  });
  const [extraLoading, setExtraLoading] = useState(true);
  
  let user: any = null;
  let role: AppRole | null = null;
  let isLoading = true;
  
  try {
    const authResult = useAuth();
    user = authResult.user;
    role = authResult.role;
    isLoading = authResult.isLoading;
  } catch {
    // If not within AuthProvider, use standalone version
    return useUserRoleStandalone();
  }

  useEffect(() => {
    const fetchExtraRoleData = async () => {
      if (!user?.id) {
        setRoleData({ role: null, is_primary_admin: false });
        setExtraLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("is_primary_admin")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching extra role data:", error);
        } else if (data) {
          setRoleData({
            role,
            is_primary_admin: data.is_primary_admin || false,
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
  const isManager = role === "manager";
  const isStaff = role === "staff";
  const isTeacher = role === "teacher";

  // Business logic permissions
  const canDelete = isAdmin || isManager;
  const canManageUsers = isAdmin;
  const canAssignAdmins = isPrimaryAdmin;

  return {
    role,
    isPrimaryAdmin,
    isAdmin,
    isManager,
    isStaff,
    isTeacher,
    isLoading: isLoading || extraLoading,
    userId: user?.id ?? null,
    canDelete,
    canManageUsers,
    canAssignAdmins,
  };
}
