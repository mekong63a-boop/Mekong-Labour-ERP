import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { useUserRole, Department } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Users, Search, UserCog, Crown, Briefcase, GraduationCap, Star, Building2 } from "lucide-react";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole | null;
  is_primary_admin: boolean;
  department: Department | null;
  created_at: string;
}

const roleOptions: { value: AppRole; label: string; icon: any; color: string; description: string }[] = [
  { value: "admin", label: "Admin", icon: Crown, color: "bg-red-500", description: "Gần như toàn quyền" },
  { value: "manager", label: "Trưởng phòng", icon: Briefcase, color: "bg-blue-500", description: "CRUD trong phòng ban" },
  { value: "staff", label: "Nhân viên", icon: Users, color: "bg-green-500", description: "Xem + Thêm + Sửa" },
  { value: "teacher", label: "Giáo viên", icon: GraduationCap, color: "bg-purple-500", description: "Module Đào tạo" },
];

const departmentOptions: { value: Department; label: string }[] = [
  { value: "recruitment", label: "Phòng Tuyển dụng" },
  { value: "training", label: "Phòng Đào tạo" },
  { value: "legal", label: "Phòng Pháp lý" },
  { value: "dormitory", label: "Phòng KTX" },
  { value: "post_departure", label: "Phòng Sau xuất cảnh" },
  { value: "admin", label: "Phòng Hành chính" },
];

export default function UserManagement() {
  const { isAdmin, user } = useAuth();
  const { isPrimaryAdmin, canAssignAdmins } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Redirect non-admins
  if (!isAdmin) {
    navigate("/");
    return null;
  }

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Then get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          role: userRole?.role as AppRole | null,
          is_primary_admin: userRole?.is_primary_admin || false,
          department: userRole?.department as Department | null,
          created_at: profile.created_at,
        };
      });

      return usersWithRoles;
    },
  });

  // Count sub-admins
  const subAdminCount = users?.filter(u => u.role === "admin" && !u.is_primary_admin).length || 0;
  const canAddMoreAdmins = canAssignAdmins && subAdminCount < 2;

  // Mutation to update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole, department }: { userId: string; newRole: AppRole; department?: Department | null }) => {
      // Check if trying to assign admin role
      if (newRole === "admin") {
        if (!canAssignAdmins) {
          throw new Error("Chỉ Admin chính mới có thể gán quyền Admin");
        }
        if (subAdminCount >= 2) {
          throw new Error("Đã đạt giới hạn số lượng Admin (tối đa 2)");
        }
      }

      // Check if role exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Department is required for manager and staff
      const shouldHaveDepartment = newRole === "manager" || newRole === "staff";

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ 
            role: newRole,
            department: shouldHaveDepartment ? department : null,
            is_primary_admin: false, // Cannot change primary admin status here
          })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ 
            user_id: userId, 
            role: newRole,
            department: shouldHaveDepartment ? department : null,
            is_primary_admin: false,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Cập nhật thành công",
        description: "Đã thay đổi quyền người dùng",
      });
      setEditingUserId(null);
      setSelectedRole(null);
      setSelectedDepartment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to remove role
  const removeRoleMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Cannot remove primary admin
      const userToRemove = users?.find(u => u.user_id === userId);
      if (userToRemove?.is_primary_admin) {
        throw new Error("Không thể xóa quyền của Giám đốc (Admin chính)");
      }
      
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Đã xóa quyền",
        description: "Người dùng không còn quyền nào",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveRole = (userId: string) => {
    if (selectedRole) {
      updateRoleMutation.mutate({ 
        userId, 
        newRole: selectedRole,
        department: selectedDepartment,
      });
    }
  };

  const filteredUsers = users?.filter((u) => {
    const search = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(search) ||
      u.full_name?.toLowerCase().includes(search)
    );
  });

  const getRoleBadge = (u: UserWithRole) => {
    if (!u.role) {
      return <Badge variant="outline" className="text-muted-foreground">Chưa phân quyền</Badge>;
    }
    
    const roleInfo = roleOptions.find((r) => r.value === u.role);
    if (!roleInfo) return null;

    // Primary admin gets special treatment
    if (u.is_primary_admin) {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Star className="h-3 w-3 mr-1" />
            Admin chính
          </Badge>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col gap-1">
        <Badge className={`${roleInfo.color} text-white`}>
          <roleInfo.icon className="h-3 w-3 mr-1" />
          {roleInfo.label}
        </Badge>
        {u.department && (
          <Badge variant="outline" className="text-xs">
            <Building2 className="h-3 w-3 mr-1" />
            {departmentOptions.find(d => d.value === u.department)?.label}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <UserCog className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Quản lý phân quyền</h1>
          <p className="text-muted-foreground">
            {isPrimaryAdmin ? "Bạn là Giám đốc - có thể gán quyền Admin" : "Gán và thay đổi quyền cho người dùng"}
          </p>
        </div>
      </div>

      {/* Role Hierarchy Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Cấu trúc phân quyền:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium">Admin chính (1)</p>
                <p className="text-muted-foreground">Toàn quyền, gán Admin</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Crown className="h-4 w-4 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium">Admin ({subAdminCount}/2)</p>
                <p className="text-muted-foreground">Gần như toàn quyền</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Trưởng phòng</p>
                <p className="text-muted-foreground">CRUD phòng ban</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Nhân viên</p>
                <p className="text-muted-foreground">Xem + Thêm + Sửa</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Primary Admin */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users?.filter(u => u.is_primary_admin).length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Admin chính</p>
            </div>
          </CardContent>
        </Card>
        
        {roleOptions.map((roleOpt) => {
          const count = users?.filter((u) => u.role === roleOpt.value && !u.is_primary_admin).length || 0;
          return (
            <Card key={roleOpt.value} className="border-l-4" style={{ borderLeftColor: roleOpt.color.replace("bg-", "") }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${roleOpt.color}`}>
                  <roleOpt.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{roleOpt.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Danh sách người dùng
              </CardTitle>
              <CardDescription>
                {users?.length || 0} người dùng trong hệ thống
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Quyền hiện tại</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                          u.is_primary_admin 
                            ? "bg-gradient-to-r from-amber-500 to-orange-500" 
                            : "bg-primary/10"
                        }`}>
                          <span className={`font-medium ${u.is_primary_admin ? "text-white" : "text-primary"}`}>
                            {u.full_name?.charAt(0) || u.email?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{u.full_name || "Chưa đặt tên"}</span>
                          {u.is_primary_admin && (
                            <Badge className="ml-2 bg-amber-100 text-amber-700 text-xs">Chính</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {editingUserId === u.user_id ? (
                        <div className="space-y-2">
                          <Select
                            value={selectedRole || u.role || ""}
                            onValueChange={(val) => {
                              setSelectedRole(val as AppRole);
                              if (val !== "manager") {
                                setSelectedDepartment(null);
                              }
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Chọn quyền" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((opt) => {
                                // Disable admin option if can't add more admins
                                const disabled = opt.value === "admin" && !canAddMoreAdmins;
                                return (
                                  <SelectItem 
                                    key={opt.value} 
                                    value={opt.value}
                                    disabled={disabled}
                                  >
                                    <div className="flex items-center gap-2">
                                      <opt.icon className="h-4 w-4" />
                                      {opt.label}
                                      {disabled && " (đã đủ)"}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          
                          {/* Show department selector for manager and staff */}
                          {(selectedRole === "manager" || selectedRole === "staff" || 
                            (!selectedRole && (u.role === "manager" || u.role === "staff"))) && (
                            <Select
                              value={selectedDepartment || u.department || ""}
                              onValueChange={(val) => setSelectedDepartment(val as Department)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Chọn phòng ban" />
                              </SelectTrigger>
                              <SelectContent>
                                {departmentOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ) : (
                        getRoleBadge(u)
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.user_id === user?.id ? (
                        <Badge variant="secondary">Bạn</Badge>
                      ) : u.is_primary_admin ? (
                        <Badge variant="outline" className="text-muted-foreground">Không thể thay đổi</Badge>
                      ) : editingUserId === u.user_id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleSaveRole(u.user_id)}
                            disabled={updateRoleMutation.isPending}
                          >
                            {updateRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingUserId(null);
                              setSelectedRole(null);
                              setSelectedDepartment(null);
                            }}
                          >
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingUserId(u.user_id);
                              setSelectedRole(u.role);
                              setSelectedDepartment(u.department);
                            }}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Đổi quyền
                          </Button>
                          {u.role && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm("Bạn có chắc muốn xóa quyền của người dùng này?")) {
                                  removeRoleMutation.mutate(u.user_id);
                                }
                              }}
                            >
                              Xóa quyền
                            </Button>
                          )}
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
    </div>
  );
}
