import { useAuth, AppRole } from "./useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseUserRoleResult {
  role: AppRole | null;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  isTeacher: boolean;
  isLoading: boolean;
  userId: string | null;
  // Permission helpers
  canAccessTrainees: boolean;
  canAccessOrders: boolean;
  canAccessEducation: boolean;
  canAccessGlossary: boolean;
  canAccessSettings: boolean;
}

// Standalone hook that doesn't require AuthProvider context
export function useUserRoleStandalone(): UseUserRoleResult {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setUserId(null);
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
        } else if (data) {
          setRole(data.role as AppRole);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Error in useUserRole:", error);
        setRole(null);
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

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isStaff = role === "staff";
  const isTeacher = role === "teacher";

  const canAccessTrainees = isAdmin || isManager || isStaff;
  const canAccessOrders = isAdmin || isManager;
  const canAccessEducation = isAdmin || isManager || isTeacher;
  const canAccessGlossary = isAdmin || isManager || isStaff;
  const canAccessSettings = isAdmin;

  return {
    role,
    isAdmin,
    isManager,
    isStaff,
    isTeacher,
    isLoading,
    userId,
    canAccessTrainees,
    canAccessOrders,
    canAccessEducation,
    canAccessGlossary,
    canAccessSettings,
  };
}

// Hook that uses the AuthProvider context
export function useUserRole(): UseUserRoleResult {
  try {
    const { user, role, isLoading } = useAuth();

    const isAdmin = role === "admin";
    const isManager = role === "manager";
    const isStaff = role === "staff";
    const isTeacher = role === "teacher";

    const canAccessTrainees = isAdmin || isManager || isStaff;
    const canAccessOrders = isAdmin || isManager;
    const canAccessEducation = isAdmin || isManager || isTeacher;
    const canAccessGlossary = isAdmin || isManager || isStaff;
    const canAccessSettings = isAdmin;

    return {
      role,
      isAdmin,
      isManager,
      isStaff,
      isTeacher,
      isLoading,
      userId: user?.id ?? null,
      canAccessTrainees,
      canAccessOrders,
      canAccessEducation,
      canAccessGlossary,
      canAccessSettings,
    };
  } catch {
    // If not within AuthProvider, use standalone version
    return useUserRoleStandalone();
  }
}
