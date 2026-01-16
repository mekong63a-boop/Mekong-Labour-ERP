import { useState, useMemo, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Menu, Eye, Plus, Edit, Trash2, Save, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UserMenuPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: {
    user_id: string;
    email: string | null;
    full_name: string | null;
  };
}

interface MenuPermission {
  menu_key: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface MenuInfo {
  key: string;
  label: string;
  parent_key: string | null;
  order_index: number;
}

export function UserMenuPermissionsModal({
  open,
  onOpenChange,
  targetUser,
}: UserMenuPermissionsModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [localPermissions, setLocalPermissions] = useState<Record<string, MenuPermission>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch all menus
  const { data: menus = [], isLoading: loadingMenus } = useQuery({
    queryKey: ["all-menus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menus")
        .select("key, label, parent_key, order_index")
        .order("order_index");
      if (error) throw error;
      return data as MenuInfo[];
    },
    enabled: open,
  });

  // Fetch current user menu permissions
  const { data: currentPermissions = [], isLoading: loadingPerms } = useQuery({
    queryKey: ["user-menu-permissions", targetUser.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_menu_permissions")
        .select("*")
        .eq("user_id", targetUser.user_id);
      if (error) throw error;
      return data as (MenuPermission & { id: string; user_id: string })[];
    },
    enabled: open,
  });

  // Fetch user's departments
  const { data: userDepartments = [] } = useQuery({
    queryKey: ["user-departments", targetUser.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_members")
        .select("department, role_in_department")
        .eq("user_id", targetUser.user_id);
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setLocalPermissions({});
      setHasChanges(false);
      setInitialized(false);
    }
  }, [open]);

  // Initialize local state from fetched data
  useEffect(() => {
    if (open && !initialized && menus.length > 0 && !loadingPerms && !loadingMenus) {
      const permsMap: Record<string, MenuPermission> = {};
      
      // Initialize ALL menus with false permissions first
      menus.forEach((m) => {
        permsMap[m.key] = {
          menu_key: m.key,
          can_view: false,
          can_create: false,
          can_update: false,
          can_delete: false,
        };
      });
      
      // Override with existing permissions from DB
      currentPermissions.forEach((p) => {
        if (permsMap[p.menu_key]) {
          permsMap[p.menu_key] = {
            menu_key: p.menu_key,
            can_view: p.can_view ?? false,
            can_create: p.can_create ?? false,
            can_update: p.can_update ?? false,
            can_delete: p.can_delete ?? false,
          };
        }
      });
      
      setLocalPermissions(permsMap);
      setInitialized(true);
    }
  }, [open, menus, currentPermissions, loadingMenus, loadingPerms, initialized]);

  // Save mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete existing permissions for this user
      const { error: deleteError } = await supabase
        .from("user_menu_permissions")
        .delete()
        .eq("user_id", targetUser.user_id);
      if (deleteError) throw deleteError;

      // Insert new permissions (only those with at least can_view = true)
      const toInsert = Object.values(localPermissions)
        .filter((p) => p.can_view)
        .map((p) => ({
          user_id: targetUser.user_id,
          menu_key: p.menu_key,
          can_view: p.can_view,
          can_create: p.can_create,
          can_update: p.can_update,
          can_delete: p.can_delete,
          assigned_by: user?.id,
        }));

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("user_menu_permissions")
          .insert(toInsert);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-menu-permissions"] });
      setHasChanges(false);
      toast.success("Đã lưu quyền menu cá nhân");
    },
    onError: (error) => {
      toast.error("Lỗi khi lưu: " + (error as Error).message);
    },
  });

  const togglePermission = (
    menuKey: string,
    field: "can_view" | "can_create" | "can_update" | "can_delete"
  ) => {
    setLocalPermissions((prev) => {
      const current = prev[menuKey] || {
        menu_key: menuKey,
        can_view: false,
        can_create: false,
        can_update: false,
        can_delete: false,
      };

      let updated = { ...current };
      
      if (field === "can_view") {
        if (current.can_view) {
          updated = {
            ...current,
            can_view: false,
            can_create: false,
            can_update: false,
            can_delete: false,
          };
        } else {
          updated.can_view = true;
        }
      } else {
        updated[field] = !current[field];
        if (updated[field]) {
          updated.can_view = true;
        }
      }

      setHasChanges(true);
      return { ...prev, [menuKey]: updated };
    });
  };

  const toggleAllView = (checked: boolean) => {
    setLocalPermissions(() => {
      const newPerms: Record<string, MenuPermission> = {};
      menus.forEach((menu) => {
        newPerms[menu.key] = {
          menu_key: menu.key,
          can_view: checked,
          can_create: false,
          can_update: false,
          can_delete: false,
        };
      });
      setHasChanges(true);
      return newPerms;
    });
  };

  const getPermission = (menuKey: string) => {
    return (
      localPermissions[menuKey] || {
        menu_key: menuKey,
        can_view: false,
        can_create: false,
        can_update: false,
        can_delete: false,
      }
    );
  };

  // Group menus by parent - sort properly
  const groupedMenus = useMemo(() => {
    const parents = menus
      .filter((m) => !m.parent_key)
      .sort((a, b) => a.order_index - b.order_index);
    const children = menus.filter((m) => m.parent_key);
    
    return parents.map((parent) => ({
      ...parent,
      children: children
        .filter((c) => c.parent_key === parent.key)
        .sort((a, b) => a.order_index - b.order_index),
    }));
  }, [menus]);

  const isLoading = loadingMenus || loadingPerms || !initialized;

  const allViewChecked = useMemo(() => {
    if (menus.length === 0) return false;
    return menus.every((m) => getPermission(m.key).can_view);
  }, [menus, localPermissions]);

  const selectedCount = useMemo(() => {
    return Object.values(localPermissions).filter(p => p.can_view).length;
  }, [localPermissions]);

  const departmentLabels: Record<string, string> = {
    recruitment: "Tuyển dụng",
    training: "Đào tạo",
    legal: "Hồ sơ",
    dormitory: "KTX",
    post_departure: "Sau xuất cảnh",
    admin: "Hành chính",
    collaborator: "Cộng tác viên",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {targetUser.full_name?.charAt(0) || targetUser.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Quyền cá nhân - {targetUser.full_name || "Chưa đặt tên"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{targetUser.email}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">{selectedCount}/{menus.length} menu</Badge>
          </div>
          <DialogDescription className="space-y-2">
            <p>Tick chọn menu mà người dùng này được phép truy cập.</p>
            {userDepartments.length > 0 && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                <strong>⚠️ Lưu ý:</strong> User thuộc phòng ban: {userDepartments.map(d => (
                  <Badge key={d.department} variant="outline" className="mx-1">
                    {departmentLabels[d.department] || d.department} ({d.role_in_department === 'manager' ? 'Trưởng phòng' : 'Nhân viên'})
                  </Badge>
                ))}
                <br />
                Quyền thực tế = Quyền cá nhân ∩ Quyền phòng ban (giao 2 tập quyền).
              </div>
            )}
            {userDepartments.length === 0 && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
                <strong>ℹ️</strong> User chưa thuộc phòng ban nào. Quyền cá nhân sẽ chỉ có hiệu lực nếu user được gán vào phòng ban.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Header row */}
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg text-sm font-medium">
              <div className="flex-1 flex items-center gap-2">
                <Menu className="h-4 w-4" />
                Menu
              </div>
              <div className="w-20 text-center flex items-center justify-center gap-1">
                <Eye className="h-3 w-3" />
                <span>Xem</span>
              </div>
              <div className="w-20 text-center flex items-center justify-center gap-1">
                <Plus className="h-3 w-3" />
                <span>Thêm</span>
              </div>
              <div className="w-20 text-center flex items-center justify-center gap-1">
                <Edit className="h-3 w-3" />
                <span>Sửa</span>
              </div>
              <div className="w-20 text-center flex items-center justify-center gap-1">
                <Trash2 className="h-3 w-3" />
                <span>Xóa</span>
              </div>
            </div>

            {/* Toggle all */}
            <div className="flex items-center gap-4 p-2 border rounded-lg bg-blue-50">
              <div className="flex-1 font-medium text-sm">Chọn tất cả</div>
              <div className="w-20 flex justify-center">
                <Checkbox
                  checked={allViewChecked}
                  onCheckedChange={(checked) => toggleAllView(!!checked)}
                />
              </div>
              <div className="w-20" />
              <div className="w-20" />
              <div className="w-20" />
            </div>

            {/* Menu list */}
            <ScrollArea className="flex-1 min-h-0 max-h-[350px]">
              <div className="space-y-1 pr-4">
                {groupedMenus.map((parent) => {
                  const parentPerm = getPermission(parent.key);
                  return (
                    <div key={parent.key}>
                      {/* Parent menu */}
                      <div className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded">
                        <div className="flex-1 font-medium">{parent.label}</div>
                        <div className="w-20 flex justify-center">
                          <Checkbox
                            checked={parentPerm.can_view}
                            onCheckedChange={() => togglePermission(parent.key, "can_view")}
                          />
                        </div>
                        <div className="w-20 flex justify-center">
                          <Checkbox
                            checked={parentPerm.can_create}
                            onCheckedChange={() => togglePermission(parent.key, "can_create")}
                            disabled={!parentPerm.can_view}
                          />
                        </div>
                        <div className="w-20 flex justify-center">
                          <Checkbox
                            checked={parentPerm.can_update}
                            onCheckedChange={() => togglePermission(parent.key, "can_update")}
                            disabled={!parentPerm.can_view}
                          />
                        </div>
                        <div className="w-20 flex justify-center">
                          <Checkbox
                            checked={parentPerm.can_delete}
                            onCheckedChange={() => togglePermission(parent.key, "can_delete")}
                            disabled={!parentPerm.can_view}
                          />
                        </div>
                      </div>

                      {/* Child menus */}
                      {parent.children.map((child) => {
                        const childPerm = getPermission(child.key);
                        return (
                          <div
                            key={child.key}
                            className="flex items-center gap-4 p-2 pl-8 hover:bg-muted/50 rounded text-sm"
                          >
                            <div className="flex-1 text-muted-foreground">
                              └ {child.label}
                            </div>
                            <div className="w-20 flex justify-center">
                              <Checkbox
                                checked={childPerm.can_view}
                                onCheckedChange={() => togglePermission(child.key, "can_view")}
                              />
                            </div>
                            <div className="w-20 flex justify-center">
                              <Checkbox
                                checked={childPerm.can_create}
                                onCheckedChange={() => togglePermission(child.key, "can_create")}
                                disabled={!childPerm.can_view}
                              />
                            </div>
                            <div className="w-20 flex justify-center">
                              <Checkbox
                                checked={childPerm.can_update}
                                onCheckedChange={() => togglePermission(child.key, "can_update")}
                                disabled={!childPerm.can_view}
                              />
                            </div>
                            <div className="w-20 flex justify-center">
                              <Checkbox
                                checked={childPerm.can_delete}
                                onCheckedChange={() => togglePermission(child.key, "can_delete")}
                                disabled={!childPerm.can_view}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Save button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Đóng
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !hasChanges}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}