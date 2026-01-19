import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCanAccessMenu } from '@/hooks/useMenuPermissions';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface MenuProtectedRouteProps {
  children: ReactNode;
  menuKey: string;
  requiredAction?: 'view' | 'create' | 'update' | 'delete';
  fallback?: ReactNode;
}

/**
 * =====================================================
 * SYSTEM FIX - MenuProtectedRoute
 * =====================================================
 * 
 * QUY TẮC BẮT BUỘC:
 * 1. AUTH loading → CHẶN UI (redirect to login)
 * 2. PERMISSION loading → KHÔNG CHẶN UI (render children, permission check ngầm)
 * 3. Permission được cache theo session, KHÔNG refetch khi focus tab
 * 
 * KHÔNG BAO GIỜ hiển thị "Đang kiểm tra quyền..." khi chỉ chuyển tab
 * =====================================================
 */
export function MenuProtectedRoute({
  children,
  menuKey,
  requiredAction = 'view',
  fallback,
}: MenuProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { canView, canCreate, canUpdate, canDelete, isLoading: permissionLoading, isPrimaryAdmin } = useCanAccessMenu(menuKey);

  // ★ CHỈ AUTH loading mới chặn UI
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ★ PERMISSION loading → KHÔNG CHẶN UI
  // Primary Admin hoặc đang load permission → render children
  // Permission sẽ được apply sau khi load xong (nếu cần)
  if (isPrimaryAdmin || permissionLoading) {
    return <>{children}</>;
  }

  // Check required permission
  const hasPermission = (() => {
    switch (requiredAction) {
      case 'view': return canView;
      case 'create': return canCreate;
      case 'update': return canUpdate;
      case 'delete': return canDelete;
      default: return false;
    }
  })();

  // Access denied - chỉ hiển thị khi CHẮC CHẮN không có quyền (đã load xong)
  if (!hasPermission) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Không có quyền truy cập
          </h1>
          <p className="text-muted-foreground mb-6">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cần được cấp quyền.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default MenuProtectedRoute;
