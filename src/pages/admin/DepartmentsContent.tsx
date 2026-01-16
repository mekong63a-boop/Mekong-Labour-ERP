import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Users, Crown, Briefcase, UserCheck, GraduationCap, Star } from "lucide-react";
import { Loader2 } from "lucide-react";
import { AppRole } from "@/hooks/useAuth";
import { Department } from "@/hooks/useUserRole";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole | null;
  is_primary_admin: boolean;
  department: Department | null;
}

const departmentConfig: { value: Department; label: string; icon: any; color: string; description: string }[] = [
  { 
    value: "recruitment", 
    label: "Phòng Tuyển dụng", 
    icon: UserCheck, 
    color: "bg-blue-500",
    description: "Quản lý học viên, hồ sơ, phỏng vấn"
  },
  { 
    value: "training", 
    label: "Phòng Đào tạo", 
    icon: GraduationCap, 
    color: "bg-purple-500",
    description: "Quản lý lớp học, giáo viên, điểm danh"
  },
  { 
    value: "legal", 
    label: "Bộ phận hồ sơ", 
    icon: Building2, 
    color: "bg-amber-500",
    description: "Quản lý hồ sơ pháp lý, visa, COE"
  },
  { 
    value: "dormitory", 
    label: "Phòng KTX", 
    icon: Building2, 
    color: "bg-green-500",
    description: "Quản lý ký túc xá, phòng ở"
  },
  { 
    value: "post_departure", 
    label: "Phòng Sau xuất cảnh", 
    icon: Users, 
    color: "bg-orange-500",
    description: "Theo dõi TTS tại Nhật"
  },
  { 
    value: "admin", 
    label: "Phòng Hành chính", 
    icon: Briefcase, 
    color: "bg-gray-500",
    description: "Quản lý hành chính, nhân sự"
  },
];

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  manager: "Trưởng phòng",
  staff: "Nhân viên",
  teacher: "Giáo viên",
};

export default function DepartmentsContent() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["department-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

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
          department: userRole?.department as Department | null,
        };
      });

      return usersWithRoles;
    },
  });

  const getUsersByDepartment = (dept: Department) => {
    return users?.filter(u => u.department === dept) || [];
  };

  const getDepartmentHead = (dept: Department) => {
    return users?.find(u => u.department === dept && u.role === "manager");
  };

  const getAdmins = () => {
    return users?.filter(u => u.role === "admin") || [];
  };

  const getUnassignedUsers = () => {
    return users?.filter(u => !u.department && u.role !== "admin" && u.role) || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            {getAdmins().map((admin) => (
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
            {getAdmins().length === 0 && (
              <p className="text-muted-foreground">Chưa có admin nào</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departmentConfig.map((dept) => {
          const deptUsers = getUsersByDepartment(dept.value);
          const head = getDepartmentHead(dept.value);
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
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {deptUsers.length} người
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {head ? (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Trưởng phòng
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {head.full_name?.charAt(0) || "T"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{head.full_name || "Chưa đặt tên"}</p>
                        <p className="text-sm text-muted-foreground">{head.email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground text-center">
                      Chưa có trưởng phòng
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Nhân viên:</p>
                  {deptUsers.filter(u => u.role !== "manager").length > 0 ? (
                    <div className="space-y-2">
                      {deptUsers.filter(u => u.role !== "manager").map((user) => (
                        <div key={user.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-gray-200">
                              {user.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.full_name || "Chưa đặt tên"}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {user.role ? roleLabels[user.role] : "N/A"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Chưa có nhân viên
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Unassigned Users */}
      {getUnassignedUsers().length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              Chưa phân phòng ban
            </CardTitle>
            <CardDescription>
              Các nhân viên chưa được gán vào phòng ban cụ thể
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {getUnassignedUsers().map((user) => (
                <div key={user.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {user.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.full_name || "Chưa đặt tên"}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.role ? roleLabels[user.role] : "Chưa có quyền"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}