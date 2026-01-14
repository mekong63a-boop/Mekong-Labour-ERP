import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Users, Search, UserCog, Crown, Briefcase, GraduationCap } from "lucide-react";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole | null;
  created_at: string;
}

const roleOptions: { value: AppRole; label: string; icon: any; color: string }[] = [
  { value: "admin", label: "Quản trị viên", icon: Crown, color: "bg-red-500" },
  { value: "manager", label: "Quản lý", icon: Briefcase, color: "bg-blue-500" },
  { value: "staff", label: "Nhân viên", icon: Users, color: "bg-green-500" },
  { value: "teacher", label: "Giáo viên", icon: GraduationCap, color: "bg-purple-500" },
];

export default function UserManagement() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);

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
          created_at: profile.created_at,
        };
      });

      return usersWithRoles;
    },
  });

  // Mutation to update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });
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
      updateRoleMutation.mutate({ userId, newRole: selectedRole });
    }
  };

  const filteredUsers = users?.filter((u) => {
    const search = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(search) ||
      u.full_name?.toLowerCase().includes(search)
    );
  });

  const getRoleBadge = (role: AppRole | null) => {
    if (!role) {
      return <Badge variant="outline" className="text-muted-foreground">Chưa phân quyền</Badge>;
    }
    const roleInfo = roleOptions.find((r) => r.value === role);
    if (!roleInfo) return null;
    
    return (
      <Badge className={`${roleInfo.color} text-white`}>
        <roleInfo.icon className="h-3 w-3 mr-1" />
        {roleInfo.label}
      </Badge>
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
          <p className="text-muted-foreground">Gán và thay đổi quyền cho người dùng</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {roleOptions.map((roleOpt) => {
          const count = users?.filter((u) => u.role === roleOpt.value).length || 0;
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
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-medium text-primary">
                            {u.full_name?.charAt(0) || u.email?.charAt(0) || "U"}
                          </span>
                        </div>
                        <span className="font-medium">{u.full_name || "Chưa đặt tên"}</span>
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
                      ) : (
                        getRoleBadge(u.role)
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.user_id === user?.id ? (
                        <Badge variant="secondary">Bạn</Badge>
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
