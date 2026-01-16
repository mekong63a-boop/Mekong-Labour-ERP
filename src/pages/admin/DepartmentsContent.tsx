import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Users, Crown, Briefcase, UserCheck, GraduationCap, Star, Loader2, Settings, UserPlus, ShieldCheck, Check, X, Pencil, Trash2, UserCog } from "lucide-react";
import { DepartmentStaffModal } from "@/components/admin/DepartmentStaffModal";
import { DepartmentMenuPermissionsModal } from "@/components/admin/DepartmentMenuPermissionsModal";
import { useMenuPermissions } from "@/hooks/useMenuPermissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { useAuditLog, generateAuditDescription } from "@/hooks/useAuditLog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

type AppRole = Database["public"]["Enums"]["app_role"];

interface DepartmentCount {
  department: string;
  manager_count: number;
  staff_count: number;
  total_count: number;
}

interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_primary_admin: boolean;
}

interface PendingUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface UserWithRole {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole | null;
  role_id: string | null;
  is_primary_admin: boolean;
  created_at: string;
}

const roleOptions: { value: AppRole; label: string; icon: React.ElementType; description: string }[] = [
  { value: "admin", label: "Admin", icon: ShieldCheck, description: "Quản trị viên hệ thống" },
  { value: "manager", label: "Trưởng phòng", icon: Crown, description: "Quản lý phòng ban" },
  { value: "staff", label: "Nhân viên", icon: Users, description: "Nhân viên thông thường" },
  { value: "teacher", label: "Giáo viên", icon: GraduationCap, description: "Giáo viên đào tạo" },
];

const departmentConfig = [
  { 
    value: "recruitment", 
    label: "Phòng Tuyển dụng", 
    icon: UserCheck, 
    color: "bg-blue-500",
    description: "Quản lý học viên, hồ sơ, phỏng vấn",
    hasManager: true,
  },
  { 
    value: "training", 
    label: "Phòng Đào tạo", 
    icon: GraduationCap, 
    color: "bg-purple-500",
    description: "Quản lý lớp học, giáo viên, điểm danh",
    hasManager: true,
  },
  { 
    value: "legal", 
    label: "Bộ phận hồ sơ", 
    icon: Building2, 
    color: "bg-amber-500",
    description: "Quản lý hồ sơ pháp lý, visa, COE",
    hasManager: true,
  },
  { 
    value: "dormitory", 
    label: "Phòng KTX", 
    icon: Building2, 
    color: "bg-green-500",
    description: "Quản lý ký túc xá, phòng ở",
    hasManager: true,
  },
  { 
    value: "post_departure", 
    label: "Phòng Sau xuất cảnh", 
    icon: Users, 
    color: "bg-orange-500",
    description: "Theo dõi TTS tại Nhật",
    hasManager: true,
  },
  { 
    value: "admin", 
    label: "Phòng Hành chính", 
    icon: Briefcase, 
    color: "bg-gray-500",
    description: "Quản lý hành chính, nhân sự",
    hasManager: true,
  },
  { 
    value: "collaborator", 
    label: "Phòng Cộng tác viên", 
    icon: Users, 
    color: "bg-teal-500",
    description: "Cộng tác viên bên ngoài",
    hasManager: false,
  },
];

type ModalType = "staff" | "menu" | null;

export default function DepartmentsContent() {
  const queryClient = useQueryClient();
  const { logAudit } = useAuditLog();
  const [selectedDepartment, setSelectedDepartment] = useState<typeof departmentConfig[0] | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, AppRole>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userTab, setUserTab] = useState<"pending" | "all">("all");
  const { isPrimaryAdmin, isAdmin } = useMenuPermissions();
  const canManage = isPrimaryAdmin || isAdmin;

  // Fetch ALL users with their roles
  const { data: allUsersWithRoles = [], isLoading: loadingAllUsers, refetch: refetchAllUsers } = useQuery({
    queryKey: ["all-users-with-roles"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, created_at")
        .order("created_at", { ascending: false });
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, is_primary_admin");
      if (rolesError) throw rolesError;

      return profiles.map((p) => {
        const userRole = roles.find((r) => r.user_id === p.user_id);
        return {
          user_id: p.user_id,
          email: p.email,
          full_name: p.full_name,
          role: userRole?.role || null,
          role_id: userRole?.id || null,
          is_primary_admin: userRole?.is_primary_admin || false,
          created_at: p.created_at,
        } as UserWithRole;
      });
    },
    enabled: canManage,
  });

  // Filter users
  const pendingUsers = allUsersWithRoles.filter(u => !u.role);
  const usersWithRole = allUsersWithRoles.filter(u => u.role);
  const filteredUsers = allUsersWithRoles.filter(u => 
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Mutation to assign role to pending user with audit log
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role, userName }: { userId: string; role: AppRole; userName?: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
      
      // Log audit
      await logAudit(
        "INSERT",
        "user_roles",
        userId,
        null,
        { user_id: userId, role },
        `Cấp quyền "${roleOptions.find(r => r.value === role)?.label}" cho ${userName || userId}`
      );
    },
    onSuccess: (_, { userId }) => {
      toast.success("Đã cấp quyền thành công!");
      setPendingRoles((prev) => {
        const newRoles = { ...prev };
        delete newRoles[userId];
        return newRoles;
      });
      queryClient.invalidateQueries({ queryKey: ["all-users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  // Mutation to UPDATE role with audit log
  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, oldRole, newRole, userName }: { roleId: string; oldRole: AppRole; newRole: AppRole; userName?: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("id", roleId);
      if (error) throw error;
      
      await logAudit(
        "UPDATE",
        "user_roles",
        roleId,
        { role: oldRole },
        { role: newRole },
        `Thay đổi quyền từ "${roleOptions.find(r => r.value === oldRole)?.label}" thành "${roleOptions.find(r => r.value === newRole)?.label}" cho ${userName}`
      );
    },
    onSuccess: () => {
      toast.success("Đã cập nhật quyền thành công!");
      setEditingUserId(null);
      setEditingRole(null);
      queryClient.invalidateQueries({ queryKey: ["all-users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  // Mutation to DELETE role with audit log
  const deleteRoleMutation = useMutation({
    mutationFn: async ({ roleId, role, userName }: { roleId: string; role: AppRole; userName?: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);
      if (error) throw error;
      
      await logAudit(
        "DELETE",
        "user_roles",
        roleId,
        { role },
        null,
        `Xóa quyền "${roleOptions.find(r => r.value === role)?.label}" của ${userName}`
      );
    },
    onSuccess: () => {
      toast.success("Đã xóa quyền thành công!");
      queryClient.invalidateQueries({ queryKey: ["all-users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  // Fetch department counts using RPC
  const { data: departmentCounts = [], isLoading: loadingCounts } = useQuery({
    queryKey: ["department-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_department_counts");
      if (error) throw error;
      return (data as DepartmentCount[]) || [];
    },
  });

  // Fetch department members for display
  const { data: allMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["department-members-all"],
    queryFn: async () => {
      const { data: members, error: membersError } = await supabase
        .from("department_members")
        .select("*");
      if (membersError) throw membersError;

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name");
      if (profilesError) throw profilesError;

      return members.map((m) => {
        const profile = profiles.find((p) => p.user_id === m.user_id);
        return {
          ...m,
          email: profile?.email,
          full_name: profile?.full_name,
        };
      });
    },
  });

  // Fetch department menu permissions counts
  const { data: menuPermCounts = {} } = useQuery({
    queryKey: ["department-menu-perm-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_menu_permissions")
        .select("department");
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach((d) => {
        counts[d.department] = (counts[d.department] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch admins
  const { data: admins = [], isLoading: loadingAdmins } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("role", "admin");
      if (rolesError) throw rolesError;

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");
      if (profilesError) throw profilesError;

      const adminUsers: AdminUser[] = roles.map((role) => {
        const profile = profiles.find((p) => p.user_id === role.user_id);
        return {
          id: profile?.id || role.id,
          user_id: role.user_id,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
          is_primary_admin: role.is_primary_admin || false,
        };
      });

      return adminUsers.sort((a, b) => 
        a.is_primary_admin === b.is_primary_admin ? 0 : a.is_primary_admin ? -1 : 1
      );
    },
  });

  const getDepartmentCount = (dept: string) => {
    return departmentCounts.find((c) => c.department === dept);
  };

  const getDepartmentManager = (dept: string) => {
    return allMembers.find(
      (m) => m.department === dept && m.role_in_department === "manager"
    );
  };

  const getDepartmentStaff = (dept: string) => {
    return allMembers.filter(
      (m) => m.department === dept && m.role_in_department === "staff"
    );
  };

  const openModal = (dept: typeof departmentConfig[0], type: ModalType) => {
    setSelectedDepartment(dept);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedDepartment(null);
    setModalType(null);
  };

  const isLoading = loadingCounts || loadingMembers || loadingAdmins || loadingAllUsers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Management Section */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Quản lý tài khoản & phân quyền
              <Badge variant="secondary" className="ml-2">{allUsersWithRoles.length} người dùng</Badge>
              {pendingUsers.length > 0 && (
                <Badge variant="destructive" className="ml-1">{pendingUsers.length} chờ cấp quyền</Badge>
              )}
            </CardTitle>
            <CardDescription>Cấp quyền, chỉnh sửa và quản lý tất cả tài khoản trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role Logic Explanation */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Logic phân quyền hệ thống
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>• Primary Admin & Admin:</strong> Full quyền - Bỏ qua tất cả các hạn chế menu và phòng ban</p>
                <p><strong>• Manager/Staff/Teacher:</strong> Quyền = Quyền cá nhân ∩ Quyền phòng ban (giao 2 tập quyền)</p>
                <p className="text-blue-600 mt-2">
                  → Ví dụ: Nếu user có quyền hệ thống "Staff" và thuộc "Phòng Tuyển dụng", 
                  họ chỉ thấy menu mà <strong>cả 2</strong> đều cho phép (user permission + department permission).
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {/* Search & Tabs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Input 
                  placeholder="Tìm theo tên hoặc email..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="sm:max-w-xs"
                />
                <Tabs value={userTab} onValueChange={(v) => setUserTab(v as "pending" | "all")} className="flex-1">
                  <TabsList>
                    <TabsTrigger value="all">
                      Tất cả ({usersWithRole.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      Chờ cấp quyền ({pendingUsers.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Users Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Quyền hệ thống</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(userTab === "pending" ? pendingUsers : filteredUsers).map((user) => {
                      const isEditing = editingUserId === user.user_id;
                      const isPrimary = user.is_primary_admin;
                      
                      return (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={isPrimary ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : "bg-muted"}>
                                  {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{user.full_name || "Chưa đặt tên"}</span>
                                {isPrimary && (
                                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">Admin chính</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Select
                                value={editingRole || ""}
                                onValueChange={(val) => setEditingRole(val as AppRole)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      <div className="flex items-center gap-2">
                                        <opt.icon className="h-4 w-4" />
                                        {opt.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : user.role ? (
                              <Badge variant={user.role === "admin" ? "destructive" : user.role === "manager" ? "default" : "secondary"}>
                                {roleOptions.find(r => r.value === user.role)?.label || user.role}
                              </Badge>
                            ) : (
                              <Select
                                value={pendingRoles[user.user_id] || ""}
                                onValueChange={(val) => setPendingRoles((prev) => ({ ...prev, [user.user_id]: val as AppRole }))}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue placeholder="Chọn quyền" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      <div className="flex items-center gap-2">
                                        <opt.icon className="h-4 w-4" />
                                        {opt.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isPrimary ? (
                              <span className="text-xs text-muted-foreground">Không thể chỉnh sửa</span>
                            ) : isEditing ? (
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  disabled={!editingRole || editingRole === user.role || updateRoleMutation.isPending}
                                  onClick={() => {
                                    if (editingRole && user.role_id) {
                                      updateRoleMutation.mutate({
                                        roleId: user.role_id,
                                        oldRole: user.role!,
                                        newRole: editingRole,
                                        userName: user.full_name || user.email || undefined,
                                      });
                                    }
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingUserId(null); setEditingRole(null); }}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : user.role ? (
                              <div className="flex justify-end gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => { setEditingUserId(user.user_id); setEditingRole(user.role); }}
                                  title="Sửa quyền hệ thống"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" title="Xóa quyền">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Xóa quyền người dùng?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bạn có chắc muốn xóa quyền "{roleOptions.find(r => r.value === user.role)?.label}" của {user.full_name || user.email}? 
                                        Người dùng sẽ không còn quyền truy cập hệ thống.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() => {
                                          if (user.role_id && user.role) {
                                            deleteRoleMutation.mutate({
                                              roleId: user.role_id,
                                              role: user.role,
                                              userName: user.full_name || user.email || undefined,
                                            });
                                          }
                                        }}
                                      >
                                        Xóa quyền
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                disabled={!pendingRoles[user.user_id] || assignRoleMutation.isPending}
                                onClick={() => {
                                  if (pendingRoles[user.user_id]) {
                                    assignRoleMutation.mutate({
                                      userId: user.user_id,
                                      role: pendingRoles[user.user_id],
                                      userName: user.full_name || user.email || undefined,
                                    });
                                  }
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Cấp quyền
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(userTab === "pending" ? pendingUsers : filteredUsers).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {userTab === "pending" ? "Không có tài khoản chờ cấp quyền" : "Không tìm thấy người dùng"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Section */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Ban Giám đốc
          </CardTitle>
          <CardDescription>Quản trị viên cấp cao - toàn quyền hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
                <Avatar className={admin.is_primary_admin 
                  ? "ring-2 ring-amber-500 ring-offset-2" 
                  : ""
                }>
                  <AvatarFallback className={admin.is_primary_admin 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    : "bg-red-100 text-red-700"
                  }>
                    {admin.full_name?.charAt(0) || admin.email?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {admin.full_name || "Chưa đặt tên"}
                    {admin.is_primary_admin && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                        Admin chính
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                </div>
              </div>
            ))}
            {admins.length === 0 && (
              <p className="text-muted-foreground">Chưa có admin nào</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departmentConfig.map((dept) => {
          const counts = getDepartmentCount(dept.value);
          const manager = getDepartmentManager(dept.value);
          const staff = getDepartmentStaff(dept.value);
          const menuCount = menuPermCounts[dept.value] || 0;
          const Icon = dept.icon;
          
          return (
            <Card key={dept.value} className="overflow-hidden">
              <CardHeader className={`${dept.color} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6" />
                    <div>
                      <CardTitle className="text-white">{dept.label}</CardTitle>
                      <CardDescription className="text-white/80">
                        {dept.description}
                      </CardDescription>
                    </div>
                  </div>
                  {/* Clickable Badge for staff count */}
                  <Badge 
                    variant="secondary" 
                    className={`bg-white/20 text-white ${canManage ? 'cursor-pointer hover:bg-white/30 transition-colors' : ''}`}
                    onClick={canManage ? () => openModal(dept, "staff") : undefined}
                  >
                    {counts?.total_count || 0} người
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Manager Section - Only show if department has manager */}
                {dept.hasManager && (
                  <div 
                    className={`p-3 rounded-lg border ${
                      manager 
                        ? 'bg-blue-50 border-blue-100' 
                        : 'bg-gray-50 border-dashed'
                    } ${canManage ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}`}
                    onClick={canManage ? () => openModal(dept, "staff") : undefined}
                  >
                    <p className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Trưởng phòng
                      {canManage && (
                        <span className="text-muted-foreground ml-1">(click để quản lý)</span>
                      )}
                    </p>
                    {manager ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-500 text-white">
                            {manager.full_name?.charAt(0) || "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{manager.full_name || "Chưa đặt tên"}</p>
                          <p className="text-sm text-muted-foreground">{manager.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">
                        Chưa có trưởng phòng
                      </p>
                    )}
                  </div>
                )}

                {/* Staff Section - Clickable */}
                <div 
                  className={`space-y-2 ${canManage ? 'cursor-pointer' : ''}`}
                  onClick={canManage ? () => openModal(dept, "staff") : undefined}
                >
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    Nhân viên: 
                    <Badge variant="outline" className="ml-1">
                      {staff.length}
                    </Badge>
                    {canManage && (
                      <span className="text-muted-foreground ml-1">(click để quản lý)</span>
                    )}
                  </p>
                  {staff.length > 0 ? (
                    <div className="space-y-2">
                      {staff.slice(0, 3).map((member) => (
                        <div key={member.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-gray-200">
                              {member.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {member.full_name || "Chưa đặt tên"}
                            </p>
                          </div>
                        </div>
                      ))}
                      {staff.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{staff.length - 3} người khác
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Chưa có nhân viên
                    </p>
                  )}
                </div>

                {/* Menu Permissions Section - NEW */}
                {canManage && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => openModal(dept, "menu")}
                    >
                      <Settings className="h-4 w-4" />
                      Quyền menu
                      <Badge variant={menuCount > 0 ? "default" : "destructive"} className="ml-auto">
                        {menuCount > 0 ? `${menuCount} menu` : "Chưa cấp"}
                      </Badge>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Department Staff Modal */}
      {selectedDepartment && modalType === "staff" && (
        <DepartmentStaffModal
          open={true}
          onOpenChange={(open) => !open && closeModal()}
          department={selectedDepartment}
        />
      )}

      {/* Department Menu Permissions Modal */}
      {selectedDepartment && modalType === "menu" && (
        <DepartmentMenuPermissionsModal
          open={true}
          onOpenChange={(open) => !open && closeModal()}
          department={selectedDepartment}
        />
      )}

    </div>
  );
}
