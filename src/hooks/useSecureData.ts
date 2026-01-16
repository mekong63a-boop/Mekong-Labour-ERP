import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

/**
 * Security hook to ensure data is only fetched when user is authenticated and has proper role.
 * Use this hook at the top of components that fetch sensitive data.
 * 
 * @param requiredRoles - Optional array of roles required to access the data
 * @returns Object with security status and user info
 */
export function useSecureData(requiredRoles?: ("admin" | "manager" | "staff" | "teacher")[]) {
  const { user, role, isLoading, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Validate session on mount and when it changes
  useEffect(() => {
    if (!isLoading && !session) {
      // No valid session - redirect to login
      navigate("/login", { replace: true });
    }
  }, [isLoading, session, navigate]);

  // Check role-based access
  useEffect(() => {
    if (!isLoading && user && role && requiredRoles && !requiredRoles.includes(role)) {
      toast({
        title: "Không có quyền truy cập",
        description: "Bạn không có quyền xem dữ liệu này.",
        variant: "destructive",
      });
      navigate("/", { replace: true });
    }
  }, [isLoading, user, role, requiredRoles, navigate, toast]);

  const isAuthorized = Boolean(
    !isLoading && 
    user && 
    session && 
    role && 
    (!requiredRoles || requiredRoles.includes(role))
  );

  const canFetchData = isAuthorized;

  return {
    isLoading,
    isAuthenticated: Boolean(user && session),
    isAuthorized,
    canFetchData,
    user,
    role,
    userId: user?.id,
  };
}

/**
 * Mask sensitive data based on user permissions
 * @param value - The value to potentially mask
 * @param canView - Whether the user can view the unmasked value
 * @returns Masked or unmasked value
 */
export function maskSensitiveData(value: string | null | undefined, canView: boolean): string {
  if (!value) return "—";
  if (canView) return value;
  
  // Mask phone numbers: show first 3 and last 2 digits
  if (/^\d{10,11}$/.test(value)) {
    return value.slice(0, 3) + "****" + value.slice(-2);
  }
  
  // Mask email: show first 2 chars and domain
  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    return local.slice(0, 2) + "****@" + domain;
  }
  
  // Mask CCCD/ID numbers: show first 3 and last 3
  if (/^\d{9,12}$/.test(value)) {
    return value.slice(0, 3) + "******" + value.slice(-3);
  }
  
  // Default: mask middle portion
  if (value.length > 6) {
    return value.slice(0, 2) + "****" + value.slice(-2);
  }
  
  return "****";
}

/**
 * Check if user can view sensitive contact information
 */
export function useCanViewSensitiveData() {
  const { role, isLoading } = useAuth();
  
  // Only admin, manager, and staff can view full contact info
  const canViewContactInfo = !isLoading && role && ["admin", "manager", "staff"].includes(role);
  
  // Only admin and manager can view all personal details
  const canViewAllDetails = !isLoading && role && ["admin", "manager"].includes(role);
  
  // Only admin can view system-level sensitive data
  const canViewSystemData = !isLoading && role === "admin";
  
  return {
    isLoading,
    canViewContactInfo,
    canViewAllDetails,
    canViewSystemData,
  };
}
