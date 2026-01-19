import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { markUserSessionInactive, upsertUserSession } from "@/hooks/useSessionHeartbeat";

/**
 * Hệ thống CHỈ có 3 role:
 * - admin: Quản trị viên - toàn quyền, xem dữ liệu nhạy cảm
 * - staff + is_senior_staff=true: Nhân viên cấp cao - xem dữ liệu nhạy cảm
 * - staff + is_senior_staff=false: Nhân viên - chỉ xem dữ liệu đã mask
 */
export type AppRole = "admin" | "staff";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isSeniorStaff: boolean; // Nhân viên cấp cao
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  canViewSensitiveData: boolean; // Admin hoặc Nhân viên cấp cao
  hasAnyAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  assignFirstAdmin: () => Promise<boolean>;
}

export function useAuthState(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isSeniorStaff, setIsSeniorStaff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAnyAdmin, setHasAnyAdmin] = useState(true);

  const fetchRoleData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, is_senior_staff")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching role:", error);
        return { role: null, isSeniorStaff: false };
      }
      return {
        role: data?.role as AppRole | null,
        isSeniorStaff: data?.is_senior_staff ?? false,
      };
    } catch (error) {
      console.error("Error in fetchRoleData:", error);
      return { role: null, isSeniorStaff: false };
    }
  };

  const checkHasAnyAdmin = async () => {
    try {
      const { data, error } = await supabase.rpc("has_any_admin");
      if (error) {
        console.error("Error checking admin:", error);
        return true; // Assume admin exists on error
      }
      return data as boolean;
    } catch (error) {
      console.error("Error in checkHasAnyAdmin:", error);
      return true;
    }
  };

  useEffect(() => {
    let roleSubscription: ReturnType<typeof supabase.channel> | null = null;

    const cleanupRoleSubscription = () => {
      if (roleSubscription) {
        supabase.removeChannel(roleSubscription);
        roleSubscription = null;
      }
    };

    const setupForSession = async (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setRole(null);
        setIsSeniorStaff(false);
        cleanupRoleSubscription();

        const adminExists = await checkHasAnyAdmin();
        setHasAnyAdmin(adminExists);
        setIsLoading(false);
        return;
      }

      // Track online session immediately on SIGNED_IN / token refresh (fire-and-forget)
      void upsertUserSession(nextSession.user.id);

      // Fetch role + admin-exists in parallel to reduce login/load latency
      const [roleData, adminExists] = await Promise.all([
        fetchRoleData(nextSession.user.id),
        checkHasAnyAdmin(),
      ]);

      setRole(roleData.role);
      setIsSeniorStaff(roleData.isSeniorStaff);
      setHasAnyAdmin(adminExists);
      setIsLoading(false);

      // Subscribe to realtime changes for this user's role (single active subscription)
      cleanupRoleSubscription();
      roleSubscription = supabase
        .channel(`user_roles_${nextSession.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_roles",
            filter: `user_id=eq.${nextSession.user.id}`,
          },
          async () => {
            const updatedRoleData = await fetchRoleData(nextSession.user.id);
            setRole(updatedRoleData.role);
            setIsSeniorStaff(updatedRoleData.isSeniorStaff);
          }
        )
        .subscribe();
    };

    // Init from current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      void setupForSession(session);
    });

    // Listen for subsequent auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void setupForSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
      cleanupRoleSubscription();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check rate limit first
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc(
      "check_login_rate_limit",
      { _identifier: email.toLowerCase() }
    );

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    // Parse rate limit response
    const rateLimitData = rateLimitCheck as { allowed?: boolean; message?: string } | null;

    if (rateLimitData && rateLimitData.allowed === false) {
      return {
        error: new Error(
          rateLimitData.message || "Tài khoản bị tạm khóa. Vui lòng thử lại sau."
        ),
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Record the login attempt (non-blocking)
    void (async () => {
      try {
        await supabase.rpc("record_login_attempt", {
          _identifier: email.toLowerCase(),
          _success: !error,
        });
      } catch (e) {
        console.error("record_login_attempt error:", e);
      }
    })();

    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    const currentUserId = user?.id;
    if (currentUserId) {
      // best-effort: mark offline immediately
      void markUserSessionInactive(currentUserId);
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const assignFirstAdmin = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc("assign_first_admin", {
        _user_id: user.id,
      });
      
      if (error) {
        console.error("Error assigning admin:", error);
        return false;
      }
      
      if (data) {
        setRole("admin");
        setHasAnyAdmin(true);
      }
      
      return data as boolean;
    } catch (error) {
      console.error("Error in assignFirstAdmin:", error);
      return false;
    }
  };

  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  // Admin hoặc Nhân viên cấp cao có thể xem dữ liệu nhạy cảm
  const canViewSensitiveData = isAdmin || isSeniorStaff;

  return {
    user,
    session,
    role,
    isSeniorStaff,
    isLoading,
    isAdmin,
    isStaff,
    canViewSensitiveData,
    hasAnyAdmin,
    signIn,
    signUp,
    signOut,
    assignFirstAdmin,
  };
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = AuthContext.Provider;

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
