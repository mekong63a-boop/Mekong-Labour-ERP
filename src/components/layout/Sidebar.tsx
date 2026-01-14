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
  { path: "/profile", icon: Users, label: "Hồ sơ" },
  { path: "/trainees", icon: ClipboardList, label: "Danh sách" },
  { path: "/recruitment", icon: Users, label: "Chiêu sinh" },
  { path: "/enrollment", icon: GraduationCap, label: "Nghiệp vụ nhập học" },
  { path: "/departure", icon: Plane, label: "Nghiệp vụ làm xuất cảnh" },
  { path: "/training-program", icon: BookOpen, label: "Chương trình tu sửa" },
  { path: "/training", icon: GraduationCap, label: "Đào tạo" },
  { path: "/contracts", icon: FileSpreadsheet, label: "Hợp đồng" },
  { path: "/union", icon: Users, label: "Công đoàn" },
  { path: "/foreign-affairs", icon: Languages, label: "Tu điển chuyên ngành" },
  { path: "/statistics", icon: Monitor, label: "Chiến sự trí thống" },
  { path: "/admin", icon: Shield, label: "Quản lý" },
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
        className={cn(
          "sidebar-link",
          active && "bg-sidebar-accent text-white font-medium"
        )}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar-background text-sidebar-foreground h-screen transition-all duration-300 border-r border-sidebar-border",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo Header */}
      <div className="p-3 border-b border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <img src={mekongLogo} alt="Mekong Logo" className="h-10 w-auto" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base text-primary leading-tight">
                Mekong Labour
              </span>
              <span className="text-xs text-gray-500 leading-tight">
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
      <div className="border-t border-sidebar-border px-3 py-2 space-y-1">
        {bottomMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "sidebar-link",
              isActive(item.path) && "bg-sidebar-accent text-white font-medium"
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </div>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-white">M</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800 leading-tight">MEKONG</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
