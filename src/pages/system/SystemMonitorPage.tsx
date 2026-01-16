import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format, subDays, startOfDay, endOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Users, 
  Activity, 
  Clock, 
  Search, 
  RefreshCw,
  User,
  FileEdit,
  Trash2,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  LogIn,
  LogOut,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface UserSession {
  id: string;
  user_id: string;
  last_seen_at: string;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  created_at: string;
  email?: string;
  full_name?: string;
  role?: string | null;
  department?: string | null;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  description: string;
  ip_address: string | null;
  created_at: string;
  email?: string;
  full_name?: string;
}

interface EditPermission {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  requested_at: string;
  approved_by: string | null;
  approved_at: string | null;
  expires_at: string | null;
  status: string;
  reason: string | null;
  email?: string;
  full_name?: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  INSERT: { label: "Thêm mới", icon: Plus, color: "bg-green-100 text-green-800" },
  UPDATE: { label: "Cập nhật", icon: FileEdit, color: "bg-blue-100 text-blue-800" },
  DELETE: { label: "Xóa", icon: Trash2, color: "bg-red-100 text-red-800" },
  SELECT: { label: "Xem", icon: Eye, color: "bg-gray-100 text-gray-800" },
  LOGIN: { label: "Đăng nhập", icon: LogIn, color: "bg-purple-100 text-purple-800" },
  LOGOUT: { label: "Đăng xuất", icon: LogOut, color: "bg-orange-100 text-orange-800" },
};

const TABLE_LABELS: Record<string, string> = {
  trainees: "Học viên",
  orders: "Đơn hàng",
  companies: "Công ty tiếp nhận",
  unions: "Nghiệp đoàn",
  job_categories: "Ngành nghề",
  classes: "Lớp học",
  teachers: "Giáo viên",
  attendance: "Điểm danh",
  test_scores: "Điểm thi",
  user_roles: "Phân quyền",
  profiles: "Hồ sơ người dùng",
  family_members: "Gia đình",
  education_history: "Học vấn",
  work_history: "Kinh nghiệm làm việc",
  japan_relatives: "Người thân tại Nhật",
  trainee_reviews: "Đánh giá học viên",
  interview_history: "Lịch sử phỏng vấn",
  auth: "Xác thực",
};

export default function SystemMonitorPage() {
  const { isAdmin, isManager } = useUserRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  
  const canAccess = isAdmin || isManager;
  
  // Fetch online users
  const { data: onlineUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ["online-users"],
    queryFn: async () => {
      // Get sessions from last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: sessions, error } = await supabase
        .from("user_sessions")
        .select("*")
        .gte("last_seen_at", fiveMinutesAgo)
        .eq("is_active", true)
        .order("last_seen_at", { ascending: false });

      if (error) throw error;

      // Get user emails and profiles
      const userIds = [...new Set(sessions?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      // Get user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role, department")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const roleMap = new Map(roles?.map(r => [r.user_id, r]) || []);

      return (sessions || []).map(session => ({
        ...session,
        email: profileMap.get(session.user_id)?.email || "Unknown",
        full_name: profileMap.get(session.user_id)?.full_name || "",
        role: roleMap.get(session.user_id)?.role || null,
        department: roleMap.get(session.user_id)?.department || null,
      })) as UserSession[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: canAccess,
  });

  // Fetch audit logs
  const { data: auditLogs = [], refetch: refetchLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["audit-logs", actionFilter, tableFilter, searchTerm, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }
      if (tableFilter !== "all") {
        query = query.eq("table_name", tableFilter);
      }
      if (searchTerm) {
        query = query.ilike("description", `%${searchTerm}%`);
      }
      if (dateFrom) {
        query = query.gte("created_at", startOfDay(dateFrom).toISOString());
      }
      if (dateTo) {
        query = query.lte("created_at", endOfDay(dateTo).toISOString());
      }

      const { data: logs, error } = await query;
      if (error) throw error;

      // Get user emails
      const userIds = [...new Set(logs?.map(l => l.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (logs || []).map(log => ({
        ...log,
        email: profileMap.get(log.user_id)?.email || "Unknown",
        full_name: profileMap.get(log.user_id)?.full_name || "",
      })) as AuditLog[];
    },
    enabled: canAccess,
  });

  // Fetch edit permission requests
  const { data: editRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ["edit-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edit_permissions")
        .select("*")
        .order("requested_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user emails
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(req => ({
        ...req,
        email: profileMap.get(req.user_id)?.email || "Unknown",
        full_name: profileMap.get(req.user_id)?.full_name || "",
      })) as EditPermission[];
    },
    enabled: canAccess,
  });

  // Update current user's session
  useEffect(() => {
    const updateSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upsert session
      await supabase
        .from("user_sessions")
        .upsert({
          user_id: user.id,
          last_seen_at: new Date().toISOString(),
          is_active: true,
        }, {
          onConflict: "user_id",
        });
    };

    updateSession();
    const interval = setInterval(updateSession, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Handle approve/reject edit permission
  const handleEditPermission = async (id: string, approve: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from("edit_permissions")
      .update({
        status: approve ? "approved" : "rejected",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        expires_at: approve ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      })
      .eq("id", id);

    refetchRequests();
  };

  const getActionInfo = (action: string) => {
    return ACTION_LABELS[action] || { label: action, icon: Activity, color: "bg-gray-100 text-gray-800" };
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (auditLogs.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    const exportData = auditLogs.map(log => ({
      "Thời gian": format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: vi }),
      "Người dùng": log.full_name || log.email,
      "Email": log.email,
      "Hành động": ACTION_LABELS[log.action]?.label || log.action,
      "Bảng dữ liệu": TABLE_LABELS[log.table_name] || log.table_name,
      "Mô tả": log.description,
      "ID bản ghi": log.record_id || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lịch sử thao tác");
    
    const fromStr = dateFrom ? format(dateFrom, "ddMMyyyy") : "";
    const toStr = dateTo ? format(dateTo, "ddMMyyyy") : "";
    const fileName = `lich-su-thao-tac_${fromStr}-${toStr}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
    toast.success(`Đã xuất ${auditLogs.length} bản ghi`);
  };

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <CardTitle className="text-destructive">Không có quyền truy cập</CardTitle>
          <p className="mt-2 text-muted-foreground">
            Chỉ Admin và Manager mới có thể xem trang giám sát hệ thống.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Giám sát hệ thống</h1>
          {isManager && !isAdmin && (
            <p className="text-sm text-muted-foreground">Đang xem với quyền Manager</p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            refetchUsers();
            refetchLogs();
            refetchRequests();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang trực tuyến</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineUsers.length}</div>
            <p className="text-xs text-muted-foreground">Người dùng hoạt động trong 5 phút qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lịch sử thay đổi</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">Bản ghi trong khoảng thời gian đã chọn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Yêu cầu chỉnh sửa</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {editRequests.filter(r => r.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Đang chờ duyệt</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="online" className="gap-2">
            <Users className="h-4 w-4" />
            Đang trực tuyến ({onlineUsers.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Activity className="h-4 w-4" />
            Lịch sử thay đổi
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="h-4 w-4" />
            Yêu cầu chỉnh sửa ({editRequests.filter(r => r.status === "pending").length})
          </TabsTrigger>
        </TabsList>

        {/* Online Users Tab */}
        <TabsContent value="online">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Người dùng đang trực tuyến</CardTitle>
            </CardHeader>
            <CardContent>
              {onlineUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Không có người dùng nào đang trực tuyến
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Hoạt động lần cuối</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onlineUsers.map((user) => {
                      const getRoleLabel = (role: string | null | undefined) => {
                        switch (role) {
                          case "admin": return { label: "Quản trị viên", color: "bg-red-50 text-red-700 border-red-200" };
                          case "manager": return { label: "Quản lý", color: "bg-blue-50 text-blue-700 border-blue-200" };
                          case "staff": return { label: "Nhân viên", color: "bg-gray-50 text-gray-700 border-gray-200" };
                          case "teacher": return { label: "Giáo viên", color: "bg-purple-50 text-purple-700 border-purple-200" };
                          default: return { label: "Chưa phân quyền", color: "bg-yellow-50 text-yellow-700 border-yellow-200" };
                        }
                      };
                      const roleInfo = getRoleLabel(user.role);
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                              {user.full_name || user.email?.split("@")[0]}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={roleInfo.color}>
                              {roleInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(user.last_seen_at), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Đang hoạt động
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Lịch sử thay đổi</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Xuất Excel
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Date Range */}
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-[130px]">
                          <Calendar className="h-4 w-4 mr-2" />
                          {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Từ ngày"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground">—</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-[130px]">
                          <Calendar className="h-4 w-4 mr-2" />
                          {dateTo ? format(dateTo, "dd/MM/yyyy") : "Đến ngày"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Hành động" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="INSERT">Thêm mới</SelectItem>
                      <SelectItem value="UPDATE">Cập nhật</SelectItem>
                      <SelectItem value="DELETE">Xóa</SelectItem>
                      <SelectItem value="LOGIN">Đăng nhập</SelectItem>
                      <SelectItem value="LOGOUT">Đăng xuất</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tableFilter} onValueChange={setTableFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Bảng dữ liệu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {Object.entries(TABLE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <p className="text-center py-8 text-muted-foreground">Đang tải...</p>
              ) : auditLogs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Chưa có lịch sử thay đổi nào trong khoảng thời gian đã chọn
                </p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {auditLogs.map((log) => {
                    const actionInfo = getActionInfo(log.action);
                    const ActionIcon = actionInfo.icon;
                    
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className={`p-2 rounded-full ${actionInfo.color}`}>
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {log.full_name || log.email?.split("@")[0]}
                            </span>
                            <Badge variant="outline" className={actionInfo.color}>
                              {actionInfo.label}
                            </Badge>
                            <Badge variant="secondary">
                              {TABLE_LABELS[log.table_name] || log.table_name}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground mt-1">
                            {log.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yêu cầu chỉnh sửa dữ liệu cũ</CardTitle>
              <p className="text-sm text-muted-foreground">
                Nhân viên chỉ có thể chỉnh sửa dữ liệu trong ngày. Để chỉnh sửa dữ liệu cũ hơn, cần được phê duyệt.
              </p>
            </CardHeader>
            <CardContent>
              {editRequests.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Không có yêu cầu nào
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người yêu cầu</TableHead>
                      <TableHead>Bảng dữ liệu</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.full_name || request.email?.split("@")[0]}
                        </TableCell>
                        <TableCell>
                          {TABLE_LABELS[request.table_name] || request.table_name}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {request.reason || "—"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.requested_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              request.status === "approved" ? "default" :
                              request.status === "rejected" ? "destructive" : "secondary"
                            }
                          >
                            {request.status === "approved" ? "Đã duyệt" :
                             request.status === "rejected" ? "Từ chối" : "Chờ duyệt"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === "pending" && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleEditPermission(request.id, true)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleEditPermission(request.id, false)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
