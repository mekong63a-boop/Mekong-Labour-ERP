import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSystemRealtime, useManualRefresh } from "@/hooks/useSystemRealtime";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PendingRegistrationsNotification } from "@/components/admin/PendingRegistrationsNotification";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { cn } from "@/lib/utils";

// Page title mapping
const pageTitles: Record<string, string> = {
  "/dashboard": "Bảng điều khiển",
  "/dashboard/trainees": "Bảng điều khiển",
  "/trainees": "Danh sách học viên",
  "/orders": "Đơn hàng",
  "/partners": "Đối tác",
  "/education": "Giáo dục",
  "/dormitory": "Ký túc xá",
  "/admin": "Quản trị",
};

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Enable system-wide realtime updates for all users
  useSystemRealtime();

  // Track online sessions for ALL logged-in users
  useSessionHeartbeat();

  const { refreshAll } = useManualRefresh();

  // Get current page title
  const currentPath = location.pathname;
  const pageTitle = Object.entries(pageTitles).find(([path]) =>
    currentPath.startsWith(path)
  )?.[1] || "Mekong Labour";

  // Get user display name from email
  const userDisplayName = user?.email?.split("@")[0] || "User";
  
  // Get user initials from email
  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="flex min-h-screen w-full">
      {/* Fixed Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-60"}`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content - offset by sidebar width */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-60"}`}
      >
        {/* Header */}
        <header className="h-16 flex items-center justify-between gap-4 border-b bg-card px-6 sticky top-0 z-30 shadow-sm">
          {/* Left: Menu + Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">
              {pageTitle}
            </h1>
          </div>

          {/* Center: Spacer */}
          <div className="flex-1" />

          {/* Right: Actions + User */}
          <div className="flex items-center gap-3">
            <RefreshButton refreshAll={refreshAll} />
            
            {/* Thông báo đăng ký mới - CHỈ Primary Admin thấy */}
            <PendingRegistrationsNotification />

            {/* User Info */}
            <div className="flex items-center gap-3 pl-3 border-l">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {userDisplayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Chủ quản HT
                </p>
              </div>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-background overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
}
