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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Menu, Eye, Plus, Edit, Trash2, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DepartmentMenuPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: {
    value: string;
    label: string;
    color: string;
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

export function DepartmentMenuPermissionsModal({
  open,
  onOpenChange,
  department,
}: DepartmentMenuPermissionsModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [localPermissions, setLocalPermissions] = useState<Record<string, MenuPermission>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch all menus for permission UI (use a distinct queryKey to avoid clobbering the global sidebar menus cache)
  const { data: menus = [], isLoading: loadingMenus } = useQuery({
    queryKey: ["menus-basic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menus")
        .select("key, label, parent_key, order_index")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as MenuInfo[];
    },
    enabled: open,
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Fetch current department menu permissions
  const { data: currentPermissions = [], isLoading: loadingPerms } = useQuery({
    queryKey: ["department-menu-permissions", department.value],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_menu_permissions")
        .select("*")
        .eq("department", department.value);
      if (error) throw error;
      return data as (MenuPermission & { id: string; department: string })[];
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
      // Delete existing permissions for this department
      const { error: deleteError } = await supabase
        .from("department_menu_permissions")
        .delete()
        .eq("department", department.value);
      if (deleteError) throw deleteError;

      // Insert new permissions (only those with at least can_view = true)
      const toInsert = Object.values(localPermissions)
        .filter((p) => p.can_view)
        .map((p) => ({
          department: department.value,
          menu_key: p.menu_key,
          can_view: p.can_view,
          can_create: p.can_create,
          can_update: p.can_update,
          can_delete: p.can_delete,
          assigned_by: user?.id,
        }));

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("department_menu_permissions")
          .insert(toInsert);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-menu-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["department-menu-perm-counts"] });
      // refresh sidebar permissions immediately
      queryClient.invalidateQueries({ queryKey: ["effective-menu-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["menus-full"] });
      setHasChanges(false);
      toast.success("Đã lưu quyền menu cho phòng ban");
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
        // Nếu tắt view -> tắt tất cả các quyền khác
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
        // Nếu bật quyền khác -> tự động bật view
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

  // Flat render list to GUARANTEE all menus are displayed (even if parent_key is inconsistent)
  const flatMenus = useMemo(() => {
    const byKey = new Map(menus.map((m) => [m.key, m] as const));

    const parents = menus
      .filter((m) => !m.parent_key)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    const children = menus
      .filter((m) => !!m.parent_key)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    const childrenByParent = new Map<string, MenuInfo[]>();
    children.forEach((c) => {
      const p = c.parent_key || "";
      const arr = childrenByParent.get(p) || [];
      arr.push(c);
      childrenByParent.set(p, arr);
    });

    const result: { menu: MenuInfo; level: 0 | 1 }[] = [];

    parents.forEach((p) => {
      result.push({ menu: p, level: 0 });
      (childrenByParent.get(p.key) || []).forEach((c) => result.push({ menu: c, level: 1 }));
    });

    // Orphan children (parent_key points to a missing parent) - still render them at the end
    const parentKeys = new Set(parents.map((p) => p.key));
    children
      .filter((c) => c.parent_key && !parentKeys.has(c.parent_key))
      .forEach((c) => result.push({ menu: c, level: 1 }));

    // Any menus not included yet
    const includedKeys = new Set(result.map((r) => r.menu.key));
    menus
      .filter((m) => !includedKeys.has(m.key))
      .forEach((m) => result.push({ menu: m, level: m.parent_key ? 1 : 0 }));

    return result;
  }, [menus]);

  const isLoading = loadingMenus || loadingPerms || !initialized;

  const allViewChecked = useMemo(() => {
    if (menus.length === 0) return false;
    return menus.every((m) => getPermission(m.key).can_view);
  }, [menus, localPermissions]);

  const selectedCount = useMemo(() => {
    return Object.values(localPermissions).filter(p => p.can_view).length;
  }, [localPermissions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${department.color}`} />
            <DialogTitle>Quyền menu - {department.label}</DialogTitle>
            <Badge variant="secondary">{selectedCount}/{menus.length} menu</Badge>
          </div>
          <DialogDescription>
            Tick chọn menu mà nhân viên trong phòng ban này được phép truy cập.
            <br />
            <span className="text-destructive font-medium">
              ⚠️ Nếu không tick menu nào, nhân viên phòng ban sẽ KHÔNG THẤY menu nào.
            </span>
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
            <div className="flex items-center gap-4 p-2 border rounded-lg bg-muted/30">
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

            {/* Menu list (native scroll - stable inside Dialog) */}
            <div className="flex-1 min-h-0 overflow-auto rounded-lg border">
              <div className="space-y-1 p-2">
                {flatMenus.map(({ menu, level }) => {
                  const perm = getPermission(menu.key);
                  const isChild = level === 1;

                  return (
                    <div
                      key={menu.key}
                      className={
                        "flex items-center gap-4 p-2 hover:bg-muted/50 rounded " +
                        (isChild ? "pl-8 text-sm" : "")
                      }
                    >
                      <div className={"flex-1 " + (isChild ? "text-muted-foreground" : "font-medium")}>
                        {isChild ? `└ ${menu.label}` : menu.label}
                      </div>
                      <div className="w-20 flex justify-center">
                        <Checkbox
                          checked={perm.can_view}
                          onCheckedChange={() => togglePermission(menu.key, "can_view")}
                        />
                      </div>
                      <div className="w-20 flex justify-center">
                        <Checkbox
                          checked={perm.can_create}
                          onCheckedChange={() => togglePermission(menu.key, "can_create")}
                          disabled={!perm.can_view}
                        />
                      </div>
                      <div className="w-20 flex justify-center">
                        <Checkbox
                          checked={perm.can_update}
                          onCheckedChange={() => togglePermission(menu.key, "can_update")}
                          disabled={!perm.can_view}
                        />
                      </div>
                      <div className="w-20 flex justify-center">
                        <Checkbox
                          checked={perm.can_delete}
                          onCheckedChange={() => togglePermission(menu.key, "can_delete")}
                          disabled={!perm.can_view}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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