import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Users, Search, Crown, GraduationCap, Star } from "lucide-react";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole | null;
  is_primary_admin: boolean;
  created_at: string;
}

// Role options - CHỈ gán role hệ thống, KHÔNG gán phòng ban
const roleOptions: { value: AppRole; label: string; icon: any; color: string; description: string }[] = [
  { value: "admin", label: "Admin", icon: Crown, color: "bg-red-500", description: "Gần như toàn quyền" },
  { value: "staff", label: "Nhân viên", icon: Users, color: "bg-green-500", description: "Xem + Thêm + Sửa" },
  { value: "teacher", label: "Giáo viên", icon: GraduationCap, color: "bg-purple-500", description: "Module Đào tạo" },
];

export default function UserManagementContent() {
  const { isAdmin, user } = useAuth();
  const { isPrimaryAdmin, canAssignAdmins } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          role: userRole?.role as AppRole | null,
          is_primary_admin: userRole?.is_primary_admin || false,
          created_at: profile.created_at,
        };
      });

      return usersWithRoles;
    },
  });

  const subAdminCount = users?.filter(u => u.role === "admin" && !u.is_primary_admin).length || 0;
  const canAddMoreAdmins = canAssignAdmins && subAdminCount < 2;

  // Mutation to update user role - CHỈ role hệ thống, KHÔNG gán phòng ban
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      if (newRole === "admin") {
        if (!canAssignAdmins) {
          throw new Error("Chỉ Admin chính mới có thể gán quyền Admin");
        }
        if (subAdminCount >= 2) {
          throw new Error("Đã đạt giới hạn số lượng Admin (tối đa 2)");
        }
      }

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ 
            role: newRole,
            is_primary_admin: false,
          })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ 
            user_id: userId, 
            role: newRole,
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
      <Badge className={`${roleInfo.color} text-white`}>
        <roleInfo.icon className="h-3 w-3 mr-1" />
        {roleInfo.label}
      </Badge>
    );
  };

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center">
        <CardTitle className="text-destructive">Không có quyền truy cập</CardTitle>
        <p className="mt-2 text-muted-foreground">
          Chỉ Admin mới có thể quản lý phân quyền.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Hierarchy Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Cấu trúc phân quyền hệ thống:</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Màn hình này CHỈ dùng để gán role hệ thống. Trưởng phòng/Nhân viên phòng ban được quản lý tại tab "Quản lý phòng ban".
          </p>
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
              <Users className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Nhân viên</p>
                <p className="text-muted-foreground">Xem + Thêm + Sửa</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <GraduationCap className="h-4 w-4 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium">Giáo viên</p>
                <p className="text-muted-foreground">Module Đào tạo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                        <Select
                          value={selectedRole || u.role || ""}
                          onValueChange={(val) => setSelectedRole(val as AppRole)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Chọn quyền" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((opt) => {
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
                      ) : (
                        getRoleBadge(u)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!u.is_primary_admin && (
                        editingUserId === u.user_id ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveRole(u.user_id)}
                              disabled={updateRoleMutation.isPending}
                            >
                              Lưu
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUserId(null);
                                setSelectedRole(null);
                              }}
                            >
                              Hủy
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUserId(u.user_id);
                                setSelectedRole(u.role);
                              }}
                            >
                              Sửa
                            </Button>
                            {u.role && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive"
                                onClick={() => removeRoleMutation.mutate(u.user_id)}
                                disabled={removeRoleMutation.isPending}
                              >
                                Xóa
                              </Button>
                            )}
                          </div>
                        )
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