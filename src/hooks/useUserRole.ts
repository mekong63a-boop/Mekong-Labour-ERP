import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "staff";

interface UseUserRoleResult {
  role: AppRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  userId: string | null;
}

export function useUserRole(): UseUserRoleResult {
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
          setRole("staff"); // Default to staff if error
        } else if (data) {
          setRole(data.role as AppRole);
        } else {
          setRole("staff"); // Default to staff if no role found
        }
      } catch (error) {
        console.error("Error in useUserRole:", error);
        setRole("staff");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    role,
    isAdmin: role === "admin",
    isLoading,
    userId,
  };
}
