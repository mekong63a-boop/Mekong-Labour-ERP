import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Crown,
  Search,
  UserPlus,
  UserMinus,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DepartmentStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: {
    value: string;
    label: string;
    color: string;
  };
}

interface DepartmentMember {
  id: string;
  user_id: string;
  role_in_department: string;
  assigned_at: string;
  email: string;
  full_name: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
}

export function DepartmentStaffModal({
  open,
  onOpenChange,
  department,
}: DepartmentStaffModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch current department members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["department-members", department.value],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_department_members", {
        _department: department.value,
      });
      if (error) throw error;
      return (data as DepartmentMember[]) || [];
    },
    enabled: open,
  });

  // Fetch all users for adding
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["all-users-for-department"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name")
        .order("full_name");
      if (error) throw error;
      return (data as UserProfile[]) || [];
    },
    enabled: open,
  });

  // Get current manager and staff
  const currentManager = useMemo(
    () => members.find((m) => m.role_in_department === "manager"),
    [members]
  );
  const currentStaff = useMemo(
    () => members.filter((m) => m.role_in_department === "staff"),
    [members]
  );
  const memberUserIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members]
  );

  // Filter available users
  const availableUsers = useMemo(() => {
    return allUsers.filter((u) => {
      // Don't show users already in this department
      if (memberUserIds.has(u.user_id)) return false;
      // Don't show current user (can't assign yourself)
      if (u.user_id === user?.id) return false;
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          u.full_name?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allUsers, memberUserIds, user?.id, searchTerm]);

  // Assign manager mutation
  const assignManagerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("department_members").upsert(
        {
          user_id: userId,
          department: department.value,
          role_in_department: "manager",
          assigned_by: user?.id,
        },
        { onConflict: "user_id,department" }
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      // Invalidate + refetch immediately to minimize UI delay
      queryClient.invalidateQueries({ queryKey: ["department-members"] });
      queryClient.invalidateQueries({ queryKey: ["department-members-all"] });
      queryClient.invalidateQueries({ queryKey: ["department-counts"] });
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["department-members", department.value] }),
        queryClient.refetchQueries({ queryKey: ["department-members-all"] }),
        queryClient.refetchQueries({ queryKey: ["department-counts"] }),
      ]);
      toast.success("Đã gán trưởng phòng thành công");
    },
    onError: (error) => {
      toast.error("Lỗi khi gán trưởng phòng: " + (error as Error).message);
    },
  });

  // Add staff mutation
  const addStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("department_members").insert({
        user_id: userId,
        department: department.value,
        role_in_department: "staff",
        assigned_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["department-members"] });
      queryClient.invalidateQueries({ queryKey: ["department-members-all"] });
      queryClient.invalidateQueries({ queryKey: ["department-counts"] });
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["department-members", department.value] }),
        queryClient.refetchQueries({ queryKey: ["department-members-all"] }),
        queryClient.refetchQueries({ queryKey: ["department-counts"] }),
      ]);
      toast.success("Đã thêm nhân viên thành công");
    },
    onError: (error) => {
      toast.error("Lỗi khi thêm nhân viên: " + (error as Error).message);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("department_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["department-members"] });
      queryClient.invalidateQueries({ queryKey: ["department-members-all"] });
      queryClient.invalidateQueries({ queryKey: ["department-counts"] });
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["department-members", department.value] }),
        queryClient.refetchQueries({ queryKey: ["department-members-all"] }),
        queryClient.refetchQueries({ queryKey: ["department-counts"] }),
      ]);
      toast.success("Đã gỡ thành viên khỏi phòng ban");
    },
    onError: (error) => {
      toast.error("Lỗi khi gỡ thành viên: " + (error as Error).message);
    },
  });

  const isLoading = loadingMembers || loadingUsers;
  const isMutating =
    assignManagerMutation.isPending ||
    addStaffMutation.isPending ||
    removeMemberMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${department.color}`} />
            <DialogTitle>Quản lý nhân sự - {department.label}</DialogTitle>
          </div>
          <DialogDescription>
            Gán trưởng phòng và thêm/gỡ nhân viên trong phòng ban
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Current Manager Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm">Trưởng phòng</span>
                <Badge variant="secondary" className="text-xs">
                  Tối đa 1 người
                </Badge>
              </div>
              {currentManager ? (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-amber-500 text-white">
                        {currentManager.full_name?.charAt(0) || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {currentManager.full_name || "Chưa đặt tên"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentManager.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMemberMutation.mutate(currentManager.id)}
                    disabled={isMutating}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                  Chưa có trưởng phòng. Chọn từ danh sách bên dưới.
                </div>
              )}
            </div>

            <Separator />

            {/* Current Staff Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  Nhân viên ({currentStaff.length})
                </span>
              </div>
              {currentStaff.length > 0 ? (
                <ScrollArea className="max-h-32">
                  <div className="space-y-2">
                    {currentStaff.map((staff) => (
                      <div
                        key={staff.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {staff.full_name?.charAt(0) || "N"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {staff.full_name || "Chưa đặt tên"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {staff.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMemberMutation.mutate(staff.id)}
                          disabled={isMutating}
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Chưa có nhân viên nào
                </p>
              )}
            </div>

            <Separator />

            {/* Add Users Section */}
            <div className="flex-1 overflow-hidden flex flex-col space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="font-medium text-sm">Thêm người vào phòng ban</span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Available Users List */}
              <div className="flex-1 min-h-0 overflow-hidden rounded-lg border">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 p-2">
                    {availableUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {searchTerm
                          ? "Không tìm thấy người dùng"
                          : "Tất cả người dùng đã được gán"}
                      </p>
                    ) : (
                      availableUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-2 bg-background rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {u.full_name?.charAt(0) || u.email?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {u.full_name || "Chưa đặt tên"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {u.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {!currentManager && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => assignManagerMutation.mutate(u.user_id)}
                                disabled={isMutating}
                                className="gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
                              >
                                <Crown className="h-3 w-3" />
                                <span className="hidden sm:inline">Trưởng phòng</span>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addStaffMutation.mutate(u.user_id)}
                              disabled={isMutating}
                              className="gap-1"
                            >
                              <Check className="h-3 w-3" />
                              <span className="hidden sm:inline">Nhân viên</span>
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
