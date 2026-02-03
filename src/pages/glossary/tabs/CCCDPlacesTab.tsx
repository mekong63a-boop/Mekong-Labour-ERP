import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Save, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCanAction } from "@/hooks/useMenuPermissions";

interface CCCDPlace {
  id: string;
  name: string;
  created_at: string;
}

const CCCDPlacesTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const { hasPermission: canCreate } = useCanAction("glossary", "create");
  const { hasPermission: canUpdate } = useCanAction("glossary", "update");
  const { hasPermission: canDelete } = useCanAction("glossary", "delete");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["cccd-places", search],
    queryFn: async () => {
      let query = supabase.from("cccd_places").select("*").order("name");
      
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CCCDPlace[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const { error } = await supabase.from("cccd_places").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cccd-places"] });
      toast.success("Đã thêm nơi cấp CCCD mới");
      resetForm();
    },
    onError: () => toast.error("Không thể thêm nơi cấp CCCD"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string }) => {
      const { error } = await supabase.from("cccd_places").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cccd-places"] });
      toast.success("Đã cập nhật");
      resetForm();
    },
    onError: () => toast.error("Không thể cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cccd_places").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cccd-places"] });
      toast.success("Đã xóa");
    },
    onError: () => toast.error("Không thể xóa"),
  });

  const resetForm = () => {
    setFormData({ name: "" });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEdit = (item: CCCDPlace) => {
    setEditingId(item.id);
    setFormData({ name: item.name });
    setShowAddForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Vui lòng điền tên nơi cấp CCCD");
      return;
    }

    if (!editingId) {
      const isDuplicate = items.some(
        (item) => item.name.toLowerCase() === formData.name.toLowerCase()
      );
      if (isDuplicate) {
        toast.error(`Nơi cấp CCCD "${formData.name}" đã tồn tại trong hệ thống!`);
        return;
      }
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-800 flex items-center gap-2">
          <span>✨</span> Hướng dẫn
        </h3>
        <ul className="mt-2 text-sm text-amber-700 space-y-1">
          <li>• Quản lý danh sách các cơ quan cấp CCCD</li>
          <li>• Các nơi cấp này sẽ hiển thị trong dropdown khi nhập thông tin CCCD của học viên</li>
        </ul>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm nơi cấp CCCD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {canCreate && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm nơi cấp mới
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">{editingId ? "Chỉnh sửa nơi cấp CCCD" : "Thêm nơi cấp CCCD mới"}</h3>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Tên nơi cấp (VD: Cục Cảnh sát QLHC về TTXH...)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="flex-1"
            />
            <Button onClick={handleSubmit} className="bg-primary">
              <Save className="h-4 w-4 mr-2" />
              Lưu
            </Button>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-primary">#</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-primary">Nơi cấp CCCD</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-primary">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Chưa có nơi cấp CCCD nào
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-primary">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-primary">{item.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {canUpdate && (
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">Tổng cộng: {items.length} nơi cấp</p>
    </div>
  );
};

export default CCCDPlacesTab;
