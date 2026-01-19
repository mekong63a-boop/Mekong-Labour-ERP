import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemRealtime, useManualRefresh } from "@/hooks/useSystemRealtime";
import { toast } from "sonner";

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Enable system-wide realtime updates for all users
  useSystemRealtime();

  const { refreshAll } = useManualRefresh();

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
        <header className="h-14 flex items-center justify-between gap-4 border-b bg-background px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshAll();
                toast.success("Đã làm mới dữ liệu");
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới dữ liệu
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-background overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
