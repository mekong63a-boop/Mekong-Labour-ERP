import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import mekongLogo from "@/assets/mekong-logo.png";
import { useAuth } from "@/hooks/useAuth";

type MenuItem = {
  path: string;
  icon: any;
  label: string;
  permission?: "trainees" | "orders" | "education" | "glossary" | "settings" | "all";
  children?: {
    path: string;
    icon: any;
    label: string;
    permission?: "trainees" | "orders" | "education" | "glossary" | "settings" | "all";
  }[];
};

const menuItems: MenuItem[] = [
  { path: "/", icon: LayoutDashboard, label: "Tổng quan", permission: "all" },
  { path: "/trainees", icon: Users, label: "Học viên", permission: "trainees" },
  { path: "/orders", icon: ClipboardList, label: "Đơn hàng", permission: "orders" },
  { path: "/partners", icon: Building2, label: "Đối tác", permission: "orders" },
{ path: "/education", icon: GraduationCap, label: "Đào tạo", permission: "education" },
  {
    path: "/internal-ops",
    icon: Building2,
    label: "Nghiệp vụ nội bộ",
    permission: "trainees",
    children: [
      { path: "/dormitory", icon: Home, label: "Quản lý KTX", permission: "trainees" },
      { path: "/legal", icon: FileSpreadsheet, label: "Hồ sơ / Pháp lý", permission: "trainees" },
    ],
  },
  { path: "/post-departure", icon: Plane, label: "Nghiệp vụ sau xuất cảnh", permission: "orders" },
  { path: "/handbook", icon: BookOpen, label: "Cẩm nang tư vấn", permission: "all" },
  { path: "/violations", icon: AlertTriangle, label: "Blacklist", permission: "trainees" },
  { path: "/reports", icon: FileSpreadsheet, label: "Báo cáo", permission: "orders" },
  { path: "/glossary", icon: Languages, label: "Từ điển chuyên ngành", permission: "glossary" },
  { path: "/internal-union", icon: HandCoins, label: "Công đoàn nội bộ", permission: "orders" },
  { path: "/system-monitor", icon: Monitor, label: "Giám sát hệ thống", permission: "settings" },
  { path: "/admin/users", icon: Shield, label: "Quản lý phân quyền", permission: "settings" },
  { path: "/admin/departments", icon: Building2, label: "Quản lý phòng ban", permission: "settings" },
];

const bottomMenuItems: MenuItem[] = [
  { path: "/change-password", icon: Settings, label: "Đổi mật khẩu", permission: "all" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, role } = useAuth();
  
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isTeacher = role === "teacher";
  const isStaff = role === "staff";

  const canAccessTrainees = isAdmin || isManager || isStaff;
  const canAccessOrders = isAdmin || isManager;
  const canAccessEducation = isAdmin || isManager || isTeacher;
  const canAccessGlossary = isAdmin || isManager || isStaff;
  const canAccessSettings = isAdmin;

  const checkPermission = (permission?: string): boolean => {
    if (!permission || permission === "all") return true;
    if (isAdmin) return true;
    
    switch (permission) {
      case "trainees":
        return canAccessTrainees;
      case "orders":
        return canAccessOrders;
      case "education":
        return canAccessEducation;
      case "glossary":
        return canAccessGlossary;
      case "settings":
        return canAccessSettings;
      default:
        return false;
    }
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const toggleSubmenu = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "manager":
        return "Quản lý";
      case "staff":
        return "Nhân viên";
      case "teacher":
        return "Giáo viên";
      default:
        return "Chưa phân quyền";
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    // Check permission
    if (!checkPermission(item.permission)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.path);
    const active = isActive(item.path);

    // Filter children by permission
    const visibleChildren = item.children?.filter(child => checkPermission(child.permission));

    if (hasChildren && visibleChildren && visibleChildren.length > 0) {
      return (
        <div key={item.path}>
          <button
            onClick={() => toggleSubmenu(item.path)}
            className={cn(
              "sidebar-link w-full justify-between",
              active && "bg-sidebar-accent font-medium"
            )}
          >
            <div className="flex items-center gap-2.5">
              <item.icon className="h-4 w-4 flex-shrink-0" />
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
              {visibleChildren.map((child) => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={cn(
                    "sidebar-link py-2",
                    isActive(child.path) && "bg-sidebar-accent font-medium"
                  )}
                >
                  <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{child.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn("sidebar-link", active && "bg-sidebar-accent font-medium")}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

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

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent">
        {menuItems.map(renderMenuItem)}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border px-2 py-1.5 space-y-0.5">
        {bottomMenuItems.map((item) => {
          if (!checkPermission(item.permission)) return null;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "sidebar-link",
                isActive(item.path) && "bg-sidebar-accent font-medium"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
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
                {getRoleLabel(role)}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
