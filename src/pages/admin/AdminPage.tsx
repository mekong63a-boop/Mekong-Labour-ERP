import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, UserCog, Building2 } from "lucide-react";
import { useMenuPermissions } from "@/hooks/useMenuPermissions";
import { Card, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Import content components
import SystemMonitorContent from "./SystemMonitorContent";
import UserManagementContent from "./UserManagementContent";
import DepartmentsContent from "./DepartmentsContent";

export default function AdminPage() {
  const { isPrimaryAdmin, isAdmin, isLoading } = useMenuPermissions();
  const [activeTab, setActiveTab] = useState("system");

  const canAccess = isPrimaryAdmin || isAdmin;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <CardTitle className="text-destructive">Không có quyền truy cập</CardTitle>
          <p className="mt-2 text-muted-foreground">
            Chỉ Admin mới có thể xem trang này.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Quản trị hệ thống</h1>
        <p className="text-sm text-muted-foreground">
          Giám sát, phân quyền và quản lý phòng ban
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="system" className="gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Giám sát hệ thống</span>
            <span className="sm:hidden">Giám sát</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Quản lý phân quyền</span>
            <span className="sm:hidden">Phân quyền</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Quản lý phòng ban</span>
            <span className="sm:hidden">Phòng ban</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <SystemMonitorContent />
        </TabsContent>

        <TabsContent value="users">
          <UserManagementContent />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}