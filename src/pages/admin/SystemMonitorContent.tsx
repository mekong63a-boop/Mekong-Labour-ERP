import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatVietnameseDatetime } from "@/lib/vietnamese-utils";
import { 
  Users, 
  Activity, 
  Clock, 
  Search, 
  RefreshCw,
  FileEdit,
  Trash2,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  LogIn,
  LogOut,
  HardDrive,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";
import { useBackup } from "@/hooks/useBackup";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  role_label?: string;
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

// EditPermission interface removed - table was deleted during schema cleanup

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

export default function SystemMonitorContent() {
  const { isAdmin } = useUserRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const { runBackup, isRunning, lastResult } = useBackup();
  
  const canAccess = isAdmin;
  
  // Fetch online users
  const { data: onlineUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ["online-users"],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: sessions, error } = await supabase
        .from("user_sessions")
        .select("*")
        .gte("last_seen_at", fiveMinutesAgo)
        .eq("is_active", true)
        .order("last_seen_at", { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(sessions?.map(s => s.user_id) || [])];
      
      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      // Fetch user roles
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, role, is_senior_staff")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const roleMap = new Map(userRoles?.map(r => [r.user_id, r]) || []);

      return (sessions || []).map(session => {
        const roleData = roleMap.get(session.user_id);
        let roleLabel = "";
        if (roleData?.role === "admin") {
          roleLabel = "Admin";
        } else if (roleData?.role === "staff" && roleData?.is_senior_staff) {
          roleLabel = "Nhân viên cấp cao";
        } else if (roleData?.role === "staff") {
          roleLabel = "Nhân viên";
        }
        
        return {
          ...session,
          email: profileMap.get(session.user_id)?.email || "Unknown",
          full_name: profileMap.get(session.user_id)?.full_name || "",
          role_label: roleLabel,
        };
      }) as UserSession[];
    },
    refetchInterval: 30000,
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

  // edit_permissions table was removed during schema cleanup
  // Using empty array for backward compatibility with UI
  const editRequests: Array<{id: string; status: string; full_name?: string; email?: string; table_name: string; reason?: string; requested_at: string}> = [];
  const refetchRequests = () => {};

  // Heartbeat session (IP + User Agent) để bảng Online Users luôn đúng
  useSessionHeartbeat();

  // Handle approve/reject edit permission - disabled since table removed
  const handleEditPermission = async (_id: string, _approve: boolean) => {
    console.log("Edit permissions feature disabled - table removed");
  };

  const getActionInfo = (action: string) => {
    return ACTION_LABELS[action] || { label: action, icon: Activity, color: "bg-gray-100 text-gray-800" };
  };


  return (
    <div className="space-y-6">
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
                      <TableHead>Trình duyệt</TableHead>
                      <TableHead>Địa chỉ IP</TableHead>
                      <TableHead>Hoạt động lần cuối</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onlineUsers.map((user) => {
                      // Parse user agent to get browser name
                      const getBrowserName = (ua: string | null) => {
                        if (!ua) return "Không xác định";
                        if (ua.includes("Edg/")) return "Microsoft Edge";
                        if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Google Chrome";
                        if (ua.includes("Firefox/")) return "Mozilla Firefox";
                        if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
                        if (ua.includes("Opera/") || ua.includes("OPR/")) return "Opera";
                        return "Không xác định";
                      };

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                              {user.full_name || user.email?.split("@")[0]}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{user.email}</span>
                              {user.role_label && (
                                <Badge variant="outline" className={
                                  user.role_label === "Admin" 
                                    ? "bg-red-50 text-red-700 border-red-200" 
                                    : user.role_label === "Nhân viên cấp cao"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                                }>
                                  {user.role_label}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {getBrowserName(user.user_agent)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {user.ip_address || "—"}
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

                  {/* Action Filter */}
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

                  {/* Table Filter */}
                  <Select value={tableFilter} onValueChange={setTableFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Bảng dữ liệu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {Object.entries(TABLE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm trong mô tả..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không có dữ liệu
                </div>
              ) : (
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[160px]">Thời gian</TableHead>
                        <TableHead>Người dùng</TableHead>
                        <TableHead className="w-[100px]">Hành động</TableHead>
                        <TableHead className="w-[120px]">Bảng</TableHead>
                        <TableHead>Mô tả</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => {
                        const actionInfo = getActionInfo(log.action);
                        const ActionIcon = actionInfo.icon;
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatVietnameseDatetime(log.created_at)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{log.full_name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{log.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${actionInfo.color} text-xs`}>
                                <ActionIcon className="h-3 w-3 mr-1" />
                                {actionInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {TABLE_LABELS[log.table_name] || log.table_name}
                            </TableCell>
                            <TableCell className="text-sm max-w-[300px] truncate">
                              {log.description}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yêu cầu chỉnh sửa</CardTitle>
            </CardHeader>
            <CardContent>
              {editRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Không có yêu cầu nào
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người yêu cầu</TableHead>
                      <TableHead>Bảng</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{req.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{req.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{TABLE_LABELS[req.table_name] || req.table_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {req.reason || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(req.requested_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </TableCell>
                        <TableCell>
                          {req.status === "pending" && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                              Chờ duyệt
                            </Badge>
                          )}
                          {req.status === "approved" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Đã duyệt
                            </Badge>
                          )}
                          {req.status === "rejected" && (
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              Từ chối
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === "pending" && isAdmin && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600"
                                onClick={() => handleEditPermission(req.id, true)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => handleEditPermission(req.id, false)}
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