import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import mekongLogo from "@/assets/mekong-logo.png";

type MenuItem = {
  path: string;
  icon: any;
  label: string;
  children?: {
    path: string;
    icon: any;
    label: string;
  }[];
};

const menuItems: MenuItem[] = [
  { path: "/", icon: LayoutDashboard, label: "Tổng quan" },
  { path: "/trainees", icon: Users, label: "Học viên" },
  { path: "/orders", icon: ClipboardList, label: "Đơn hàng" },
  { path: "/partners", icon: Building2, label: "Đối tác" },
  {
    path: "/internal-ops",
    icon: Building2,
    label: "Nghiệp vụ nội bộ",
    children: [
      { path: "/training", icon: GraduationCap, label: "Đào tạo" },
      { path: "/dormitory", icon: Home, label: "Quản lý KTX" },
      { path: "/legal", icon: FileSpreadsheet, label: "Hồ sơ / Pháp lý" },
    ],
  },
  { path: "/post-departure", icon: Plane, label: "Nghiệp vụ sau xuất cảnh" },
  { path: "/handbook", icon: BookOpen, label: "Cẩm nang tư vấn" },
  { path: "/violations", icon: AlertTriangle, label: "Blacklist" },
  { path: "/reports", icon: FileSpreadsheet, label: "Báo cáo" },
  { path: "/internal-union", icon: Users, label: "Công đoàn" },
  { path: "/glossary", icon: Languages, label: "Từ điển chuyên ngành" },
  { path: "/system-monitor", icon: Monitor, label: "Giám sát hệ thống" },
  { path: "/admin", icon: Shield, label: "Quản trị" },
];

const bottomMenuItems: MenuItem[] = [
  { path: "/settings", icon: Settings, label: "Cài đặt" },
  { path: "/logout", icon: LogOut, label: "Đăng xuất" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();

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

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.path);
    const active = isActive(item.path);

    if (hasChildren) {
      return (
        <div key={item.path}>
          <button
            onClick={() => toggleSubmenu(item.path)}
            className={cn(
              "sidebar-link w-full justify-between",
              active && "bg-sidebar-accent"
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
            <div className="ml-3 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
              {item.children?.map((child) => (
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
        "flex flex-col bg-sidebar-background text-sidebar-foreground h-screen transition-all duration-300",
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
        {bottomMenuItems.map((item) => (
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
        ))}
      </div>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium">M</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-tight">Mekong</span>
              <span className="text-[11px] text-sidebar-foreground/70 leading-tight">Admin</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
