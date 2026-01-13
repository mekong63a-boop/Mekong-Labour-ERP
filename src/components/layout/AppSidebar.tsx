import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  Handshake,
  Building2,
  Plane,
  BookOpen,
  AlertTriangle,
  BarChart3,
  Building,
  Languages,
  Monitor,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import mekongLogo from "@/assets/mekong-logo.png";

const mainNavItems = [
  { title: "Tổng quan", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Học viên", icon: Users, href: "/trainees" },
  { title: "Đơn hàng", icon: Package, href: "/orders" },
  { title: "Đối tác", icon: Handshake, href: "/partners" },
  {
    title: "Nghiệp vụ nội bộ",
    icon: Building2,
    children: [
      { title: "Quản lý nhân sự", href: "/internal/hr" },
      { title: "Tài liệu nội bộ", href: "/internal/docs" },
    ],
  },
  { title: "Nghiệp vụ sau xuất cảnh", icon: Plane, href: "/post-departure" },
  { title: "Cẩm nang tư vấn", icon: BookOpen, href: "/handbook" },
  { title: "Blacklist", icon: AlertTriangle, href: "/blacklist" },
  { title: "Báo cáo", icon: BarChart3, href: "/reports" },
  { title: "Công đoàn", icon: Building, href: "/union" },
  { title: "Từ điển chuyên ngành", icon: Languages, href: "/dictionary" },
  { title: "Giám sát hệ thống", icon: Monitor, href: "/system-monitor" },
];

const bottomNavItems = [
  { title: "Cài đặt", icon: Settings, href: "/settings" },
  { title: "Đăng xuất", icon: LogOut, href: "/logout" },
];

export function AppSidebar() {
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href;

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={mekongLogo} alt="Mekong Logo" className="h-12 w-auto" />
          <div className="flex flex-col">
            <span className="font-bold text-lg text-sidebar-foreground">
              Mekong Labour
            </span>
            <span className="text-xs text-sidebar-foreground/70">
              Phần mềm quản lý TTS
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) =>
                item.children ? (
                  <Collapsible key={item.title} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(child.href)}
                              >
                                <Link
                                  to={child.href}
                                  className="text-sidebar-foreground/80 hover:text-sidebar-foreground"
                                >
                                  {child.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                    >
                      <Link to={item.href} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Link to={item.href} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-accent-foreground">
                M
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                Mekong
              </span>
              <span className="text-xs text-sidebar-foreground/70">Admin</span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
