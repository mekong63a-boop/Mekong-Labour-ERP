import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading, hasAnyAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but no admin exists and no role assigned - allow access to setup
  if (!hasAnyAdmin && !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but no role assigned (and admin exists) - show access denied
  if (!role && hasAnyAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-destructive mb-4">Chưa được phân quyền</h1>
          <p className="text-muted-foreground mb-4">
            Tài khoản của bạn chưa được Admin phân quyền.
            <br />
            Vui lòng liên hệ Admin để được cấp quyền truy cập.
          </p>
        </div>
      </div>
    );
  }

  // Check role permissions
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-destructive mb-4">Không có quyền truy cập</h1>
          <p className="text-muted-foreground">
            Bạn không có quyền truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
