import { useAuth, AppRole } from "./useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Department = "recruitment" | "training" | "legal" | "dormitory" | "post_departure" | "admin";

interface UserRoleData {
  role: AppRole | null;
  is_primary_admin: boolean;
  department: Department | null;
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
  department: Department | null;
  // Permission helpers
  canAccessTrainees: boolean;
  canAccessOrders: boolean;
  canAccessEducation: boolean;
  canAccessGlossary: boolean;
  canAccessSettings: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canAssignAdmins: boolean;
}

// Standalone hook that doesn't require AuthProvider context
export function useUserRoleStandalone(): UseUserRoleResult {
  const [roleData, setRoleData] = useState<UserRoleData>({
    role: null,
    is_primary_admin: false,
    department: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRoleData({ role: null, is_primary_admin: false, department: null });
          setUserId(null);
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("user_roles")
          .select("role, is_primary_admin, department")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRoleData({ role: null, is_primary_admin: false, department: null });
        } else if (data) {
          setRoleData({
            role: data.role as AppRole,
            is_primary_admin: data.is_primary_admin || false,
            department: data.department as Department | null,
          });
        } else {
          setRoleData({ role: null, is_primary_admin: false, department: null });
        }
      } catch (error) {
        console.error("Error in useUserRole:", error);
        setRoleData({ role: null, is_primary_admin: false, department: null });
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

  const { role, is_primary_admin, department } = roleData;
  
  const isPrimaryAdmin = role === "admin" && is_primary_admin;
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isStaff = role === "staff";
  const isTeacher = role === "teacher";

  const canAccessTrainees = isAdmin || isManager || isStaff;
  const canAccessOrders = isAdmin || isManager;
  const canAccessEducation = isAdmin || isManager || isTeacher;
  const canAccessGlossary = isAdmin || isManager || isStaff;
  const canAccessSettings = isAdmin;
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
    department,
    canAccessTrainees,
    canAccessOrders,
    canAccessEducation,
    canAccessGlossary,
    canAccessSettings,
    canDelete,
    canManageUsers,
    canAssignAdmins,
  };
}

// Hook that uses the AuthProvider context
export function useUserRole(): UseUserRoleResult {
  const [roleData, setRoleData] = useState<UserRoleData>({
    role: null,
    is_primary_admin: false,
    department: null,
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
        setRoleData({ role: null, is_primary_admin: false, department: null });
        setExtraLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("is_primary_admin, department")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching extra role data:", error);
        } else if (data) {
          setRoleData({
            role,
            is_primary_admin: data.is_primary_admin || false,
            department: data.department as Department | null,
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

  const canAccessTrainees = isAdmin || isManager || isStaff;
  const canAccessOrders = isAdmin || isManager;
  const canAccessEducation = isAdmin || isManager || isTeacher;
  const canAccessGlossary = isAdmin || isManager || isStaff;
  const canAccessSettings = isAdmin;
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
    department: roleData.department,
    canAccessTrainees,
    canAccessOrders,
    canAccessEducation,
    canAccessGlossary,
    canAccessSettings,
    canDelete,
    canManageUsers,
    canAssignAdmins,
  };
}
