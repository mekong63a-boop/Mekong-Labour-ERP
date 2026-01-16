import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "manager" | "staff" | "teacher";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isTeacher: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasAnyAdmin, setHasAnyAdmin] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching role:", error);
        return null;
      }
      return data?.role as AppRole | null;
    } catch (error) {
      console.error("Error in fetchRole:", error);
      return null;
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to prevent potential deadlock
          setTimeout(async () => {
            const userRole = await fetchRole(session.user.id);
            setRole(userRole);
            const adminExists = await checkHasAnyAdmin();
            setHasAnyAdmin(adminExists);
            setIsLoading(false);
          }, 0);
        } else {
          setRole(null);
          const adminExists = await checkHasAnyAdmin();
          setHasAnyAdmin(adminExists);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const userRole = await fetchRole(session.user.id);
        setRole(userRole);
      }
      
      const adminExists = await checkHasAnyAdmin();
      setHasAnyAdmin(adminExists);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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
        error: new Error(rateLimitData.message || "Tài khoản bị tạm khóa. Vui lòng thử lại sau.") 
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Record the login attempt
    await supabase.rpc("record_login_attempt", {
      _identifier: email.toLowerCase(),
      _success: !error,
    });

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

  return {
    user,
    session,
    role,
    isLoading,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isTeacher: role === "teacher",
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
