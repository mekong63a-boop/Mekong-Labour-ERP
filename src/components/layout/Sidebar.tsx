import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Building2,
  GraduationCap,
  Home,
  FileSpreadsheet,
  Plane,
  BookOpen,
  AlertTriangle,
  Languages,
  Monitor,
  Shield,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  HandCoins,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import mekongLogo from "@/assets/mekong-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useMenuPermissions, Menu } from "@/hooks/useMenuPermissions";
import { Skeleton } from "@/components/ui/skeleton";

// Icon mapping từ string trong database
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  ClipboardList,
  Building2,
  GraduationCap,
  Home,
  FileSpreadsheet,
  Plane,
  BookOpen,
  AlertTriangle,
  Languages,
  Monitor,
  Shield,
  Settings,
  HandCoins,
};

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, role } = useAuth();
  const { menus, visibleMenus, isPrimaryAdmin, isAdmin, isLoading } = useMenuPermissions();

  // Build menu tree structure
  const menuTree = useMemo(() => {
    if (!visibleMenus?.length) return [];

    // Lấy tất cả parent menus (không có parent_key)
    const parentMenus = visibleMenus
      .filter(m => !m.parent_key)
      .sort((a, b) => a.order_index - b.order_index);

    // Thêm children cho mỗi parent
    return parentMenus.map(parent => ({
      ...parent,
      children: visibleMenus
        .filter(m => m.parent_key === parent.key)
        .sort((a, b) => a.order_index - b.order_index),
    }));
  }, [visibleMenus]);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    if (path === "#") return false;
    
    // Handle query string paths
    if (path.includes("?")) {
      const [basePath, query] = path.split("?");
      return location.pathname === basePath && location.search.includes(query);
    }
    
    return location.pathname.startsWith(path);
  };

  const toggleSubmenu = (key: string) => {
    setExpandedMenus((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const getRoleLabel = () => {
    if (isPrimaryAdmin) return "Admin chính";
    if (isAdmin) return "Quản trị viên";
    
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "manager":
        return "Trưởng phòng";
      case "staff":
        return "Nhân viên";
      case "teacher":
        return "Giáo viên";
      default:
        return "Chưa phân quyền";
    }
  };

  const getIcon = (iconName: string | null): LucideIcon => {
    if (!iconName) return LayoutDashboard;
    return iconMap[iconName] || LayoutDashboard;
  };

  const renderMenuItem = (item: Menu & { children?: Menu[] }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.key);
    const active = isActive(item.path);
    const Icon = getIcon(item.icon);

    if (hasChildren) {
      return (
        <div key={item.key}>
          <button
            onClick={() => toggleSubmenu(item.key)}
            className={cn(
              "sidebar-link w-full justify-between",
              active && "bg-sidebar-accent font-medium"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed &&
              (isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              ))}
          </button>
          {!collapsed && isExpanded && (
            <div className="mt-1 rounded-lg bg-sidebar-accent/30 p-1 space-y-0.5">
              {item.children!.map((child) => {
                const ChildIcon = getIcon(child.icon);
                return (
                  <Link
                    key={child.key}
                    to={child.path}
                    className={cn(
                      "sidebar-link py-2",
                      isActive(child.path) && "bg-sidebar-accent font-medium"
                    )}
                  >
                    <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.key}
        to={item.path}
        className={cn("sidebar-link", active && "bg-sidebar-accent font-medium")}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <aside
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground h-screen transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="p-2">
          <div className="flex items-center gap-2.5 bg-white rounded-lg p-2">
            <Skeleton className="h-9 w-9" />
            {!collapsed && (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            )}
          </div>
        </div>
        <nav className="flex-1 px-2 py-1.5 space-y-1">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo Header */}
      <div className="p-2">
        <Link
          to="/"
          className="flex items-center gap-2.5 bg-white rounded-lg p-2"
        >
          <img src={mekongLogo} alt="Mekong Logo" className="h-9 w-auto" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-primary leading-tight">
                Mekong Labour
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                Phần mềm quản lý TTS
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation - Dynamic from database */}
      <nav className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent">
        {menuTree.map(renderMenuItem)}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border px-2 py-1.5 space-y-0.5">
        <Link
          to="/change-password"
          className={cn(
            "sidebar-link",
            isActive("/change-password") && "bg-sidebar-accent font-medium"
          )}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Đổi mật khẩu</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium leading-tight truncate">
                {user?.email?.split("@")[0] || "User"}
              </span>
              <span className="text-[11px] text-sidebar-foreground/70 leading-tight">
                {getRoleLabel()}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
