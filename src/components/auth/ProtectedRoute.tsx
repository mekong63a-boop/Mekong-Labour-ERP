import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2, ShieldAlert, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading, hasAnyAdmin, signOut } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // SECURITY: Not logged in - redirect to login
  if (!user) {
    // Clear any stale data before redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // SECURITY: Validate session is still active
  // The useAuth hook handles session validation via onAuthStateChange

  // Special case: First admin setup (no admin exists yet)
  if (!hasAnyAdmin && !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // SECURITY: Logged in but no role assigned (and admin exists) - block access completely
  if (!role && hasAnyAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-destructive mb-4">Chưa được phân quyền</h1>
          <p className="text-muted-foreground mb-6">
            Tài khoản của bạn chưa được Admin phân quyền truy cập.
            <br />
            Vui lòng liên hệ Admin để được cấp quyền.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Email: <span className="font-medium">{user.email}</span>
            </p>
            <Button 
              variant="outline" 
              onClick={() => signOut()}
              className="w-full"
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // SECURITY: Check role-based permissions strictly
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-destructive mb-4">Không có quyền truy cập</h1>
          <p className="text-muted-foreground mb-2">
            Bạn không có quyền truy cập trang này.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Vai trò hiện tại: <span className="font-medium capitalize">{role}</span>
            <br />
            Yêu cầu: <span className="font-medium">{allowedRoles.join(", ")}</span>
          </p>
          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              Quay lại
            </Button>
            <Button onClick={() => window.location.href = "/"}>
              Trang chủ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // SECURITY: All checks passed - render protected content
  // The RLS policies on the backend will enforce data-level security
  return <>{children}</>;
}
