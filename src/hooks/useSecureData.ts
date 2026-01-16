import { useEffect, useMemo } from "react";
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
 * Mask CCCD/ID card numbers - only show last 4 digits
 */
export function maskCCCD(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return "********" + value.slice(-4);
}

/**
 * Mask passport numbers - only show last 3 characters
 */
export function maskPassport(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.length <= 3) return value;
  return "*****" + value.slice(-3);
}

/**
 * Mask phone numbers - show first 3 and last 2 digits
 */
export function maskPhone(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.length <= 5) return value;
  return value.slice(0, 3) + "****" + value.slice(-2);
}

/**
 * Mask email addresses - show first 2 chars and domain
 */
export function maskEmail(value: string | null | undefined): string {
  if (!value) return "—";
  if (!value.includes("@")) return "****";
  const [local, domain] = value.split("@");
  if (local.length <= 2) return local + "****@" + domain;
  return local.slice(0, 2) + "****@" + domain;
}

/**
 * Mask address - only show province/city
 */
export function maskAddress(value: string | null | undefined): string {
  if (!value) return "—";
  // Try to extract last part (usually province/city)
  const parts = value.split(",").map(p => p.trim());
  if (parts.length > 1) {
    return "******, " + parts[parts.length - 1];
  }
  if (value.length > 15) {
    return "******" + value.slice(-10);
  }
  return value;
}

/**
 * Mask sensitive data based on user permissions (legacy function for backward compatibility)
 * @param value - The value to potentially mask
 * @param canView - Whether the user can view the unmasked value
 * @returns Masked or unmasked value
 */
export function maskSensitiveData(value: string | null | undefined, canView: boolean): string {
  if (!value) return "—";
  if (canView) return value;
  
  // Auto-detect type and mask
  // CCCD format: 12 digits
  if (/^\d{12}$/.test(value)) {
    return maskCCCD(value);
  }
  
  // Old ID format: 9 digits
  if (/^\d{9}$/.test(value)) {
    return maskCCCD(value);
  }
  
  // Phone numbers: 10-11 digits
  if (/^\d{10,11}$/.test(value)) {
    return maskPhone(value);
  }
  
  // Email
  if (value.includes("@")) {
    return maskEmail(value);
  }
  
  // Passport: alphanumeric, 8-9 chars
  if (/^[A-Z]\d{7,8}$/i.test(value)) {
    return maskPassport(value);
  }
  
  // Default: mask middle portion
  if (value.length > 6) {
    return value.slice(0, 2) + "****" + value.slice(-2);
  }
  
  return "****";
}

/**
 * Hook to check data masking permissions and get masking functions
 */
export function useDataMasking() {
  const { role, isLoading } = useAuth();
  
  // Manager+ can view all sensitive data without masking
  const canViewUnmasked = !isLoading && role && ["admin", "manager"].includes(role);
  
  // Staff can view some contact info
  const isStaff = !isLoading && role === "staff";
  
  const maskedValue = useMemo(() => {
    return (value: string | null | undefined, type: "cccd" | "passport" | "phone" | "email" | "address") => {
      if (canViewUnmasked) return value || "—";
      
      switch (type) {
        case "cccd":
          return maskCCCD(value);
        case "passport":
          return maskPassport(value);
        case "phone":
          // Staff can see partial phone
          return isStaff ? maskPhone(value) : "**********";
        case "email":
          return isStaff ? maskEmail(value) : "****@****.***";
        case "address":
          return maskAddress(value);
        default:
          return maskSensitiveData(value, canViewUnmasked);
      }
    };
  }, [canViewUnmasked, isStaff]);
  
  return {
    isLoading,
    canViewUnmasked,
    maskedValue,
    // Individual functions for specific use cases
    maskCCCD: canViewUnmasked ? (v: string | null | undefined) => v || "—" : maskCCCD,
    maskPassport: canViewUnmasked ? (v: string | null | undefined) => v || "—" : maskPassport,
    maskPhone: canViewUnmasked ? (v: string | null | undefined) => v || "—" : maskPhone,
    maskEmail: canViewUnmasked ? (v: string | null | undefined) => v || "—" : maskEmail,
    maskAddress: canViewUnmasked ? (v: string | null | undefined) => v || "—" : maskAddress,
  };
}

/**
 * Check if user can view sensitive contact information
 */
export function useCanViewSensitiveData() {
  const { role, isLoading } = useAuth();
  
  // Only admin and manager can view full contact info without masking
  const canViewContactInfo = !isLoading && role && ["admin", "manager"].includes(role);
  
  // Only admin and manager can view all personal details
  const canViewAllDetails = !isLoading && role && ["admin", "manager"].includes(role);
  
  // Only admin can view system-level sensitive data
  const canViewSystemData = !isLoading && role === "admin";
  
  // Staff can view basic contact info (masked)
  const canViewBasicContact = !isLoading && role && ["admin", "manager", "staff"].includes(role);
  
  return {
    isLoading,
    canViewContactInfo,
    canViewAllDetails,
    canViewSystemData,
    canViewBasicContact,
  };
}
