import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Users, Crown, Briefcase, UserCheck, GraduationCap, Star } from "lucide-react";
import { Loader2 } from "lucide-react";
import { AppRole } from "@/hooks/useAuth";

/**
 * DepartmentsPage - Trang xem cấu trúc tổ chức (read-only)
 * 
 * NGUỒN DỮ LIỆU:
 * - Phòng ban + nhân sự: department_members (nguồn sự thật)
 * - Role hệ thống: user_roles
 */

type Department = "recruitment" | "training" | "legal" | "dormitory" | "post_departure" | "admin" | "collaborator";

interface DepartmentMember {
  id: string;
  user_id: string;
  department: string;
  role_in_department: string;
  email?: string | null;
  full_name?: string | null;
}

interface AdminUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_primary_admin: boolean;
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
  { 
    value: "collaborator", 
    label: "Phòng Cộng tác viên", 
    icon: Users, 
    color: "bg-teal-500",
    description: "Cộng tác viên bên ngoài"
  },
];

const roleInDeptLabels: Record<string, string> = {
  manager: "Trưởng phòng",
  staff: "Nhân viên",
};

export default function DepartmentsPage() {
  // Fetch department members from the correct source of truth
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["department-members-view"],
    queryFn: async () => {
      const { data: membersData, error: membersError } = await supabase
        .from("department_members")
        .select("*");
      if (membersError) throw membersError;

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name");
      if (profilesError) throw profilesError;

      return membersData.map((m) => {
        const profile = profiles.find((p) => p.user_id === m.user_id);
        return {
          ...m,
          email: profile?.email,
          full_name: profile?.full_name,
        } as DepartmentMember;
      });
    },
  });

  // Fetch admins separately from user_roles
  const { data: admins = [], isLoading: loadingAdmins } = useQuery({
    queryKey: ["admin-users-view"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, is_primary_admin")
        .eq("role", "admin");
      if (rolesError) throw rolesError;

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name");
      if (profilesError) throw profilesError;

      return roles.map((r) => {
        const profile = profiles.find((p) => p.user_id === r.user_id);
        return {
          user_id: r.user_id,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
          is_primary_admin: r.is_primary_admin || false,
        } as AdminUser;
      }).sort((a, b) => (a.is_primary_admin === b.is_primary_admin ? 0 : a.is_primary_admin ? -1 : 1));
    },
  });

  // Get members by department
  const getMembersByDepartment = (dept: Department) => {
    return members.filter((m) => m.department === dept);
  };

  // Get department head (manager)
  const getDepartmentHead = (dept: Department) => {
    return members.find((m) => m.department === dept && m.role_in_department === "manager");
  };

  const isLoading = loadingMembers || loadingAdmins;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Quản lý phòng ban</h1>
          <p className="text-muted-foreground">Xem cấu trúc tổ chức và nhân sự theo phòng ban</p>
        </div>
      </div>

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
              <div key={admin.user_id} className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
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
          const deptMembers = getMembersByDepartment(dept.value);
          const head = getDepartmentHead(dept.value);
          const staffMembers = deptMembers.filter((m) => m.role_in_department === "staff");
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
                    {deptMembers.length} người
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Department Head */}
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

                {/* Staff List */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Nhân viên:</p>
                  {staffMembers.length > 0 ? (
                    <div className="space-y-2">
                      {staffMembers.map((member) => (
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
                          <Badge variant="outline" className="text-xs">
                            {roleInDeptLabels[member.role_in_department] || member.role_in_department}
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
    </div>
  );
}
