import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Save, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCanAction } from "@/hooks/useMenuPermissions";

interface KatakanaName {
  id: string;
  vietnamese_name: string;
  katakana: string;
  created_at: string;
}

const KatakanaTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ vietnamese_name: "", katakana: "" });
  const { hasPermission: canCreate } = useCanAction("glossary", "create");
  const { hasPermission: canUpdate } = useCanAction("glossary", "update");
  const { hasPermission: canDelete } = useCanAction("glossary", "delete");

  const { data: names = [], isLoading } = useQuery({
    queryKey: ["katakana-names", search],
    queryFn: async () => {
      let query = supabase.from("katakana_names").select("*").order("vietnamese_name");
      
      if (search) {
        query = query.or(`vietnamese_name.ilike.%${search}%,katakana.ilike.%${search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as KatakanaName[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { vietnamese_name: string; katakana: string }) => {
      const { error } = await supabase.from("katakana_names").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["katakana-names"] });
      toast.success("Đã thêm tên mới");
      resetForm();
    },
    onError: () => toast.error("Không thể thêm tên"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; vietnamese_name: string; katakana: string }) => {
      const { error } = await supabase.from("katakana_names").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["katakana-names"] });
      toast.success("Đã cập nhật");
      resetForm();
    },
    onError: () => toast.error("Không thể cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("katakana_names").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["katakana-names"] });
      toast.success("Đã xóa");
    },
    onError: () => toast.error("Không thể xóa"),
  });

  const resetForm = () => {
    setFormData({ vietnamese_name: "", katakana: "" });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEdit = (item: KatakanaName) => {
    setEditingId(item.id);
    setFormData({ vietnamese_name: item.vietnamese_name, katakana: item.katakana });
    setShowAddForm(true);
  };

  const handleSubmit = () => {
    if (!formData.vietnamese_name || !formData.katakana) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Check for duplicate when adding new
    if (!editingId) {
      const isDuplicate = names.some(
        (item) => item.vietnamese_name.toLowerCase() === formData.vietnamese_name.toLowerCase()
      );
      if (isDuplicate) {
        toast.error(`Tên "${formData.vietnamese_name}" đã tồn tại trong hệ thống!`);
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
      {/* Guide Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-800 flex items-center gap-2">
          <span>✨</span> Hướng dẫn bảng Katakana
        </h3>
        <ul className="mt-2 text-sm text-amber-700 space-y-1">
          <li>• Dùng để tự động chuyển đổi <strong>Họ và Tên tiếng Việt → Katakana</strong></li>
          <li>• Nhập tên không dấu (VD: TRAN, NGUYEN) → sẽ tự động match cả tên có dấu</li>
          <li>• Khi xuất Excel, hệ thống sẽ tự động chuyển đổi tên theo bảng này</li>
        </ul>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {canCreate && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm tên mới
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">{editingId ? "Chỉnh sửa tên" : "Thêm tên mới"}</h3>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Tên tiếng Việt (VD: TRAN hoặc TRẦN)"
              value={formData.vietnamese_name}
              onChange={(e) => setFormData({ ...formData, vietnamese_name: e.target.value.toUpperCase() })}
              className="flex-1"
            />
            <Input
              placeholder="Katakana (VD: チャン)"
              value={formData.katakana}
              onChange={(e) => setFormData({ ...formData, katakana: e.target.value })}
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

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-primary">#</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-primary">Tên tiếng Việt (không dấu)</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-primary">Katakana</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-primary">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : names.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Chưa có tên nào
                </td>
              </tr>
            ) : (
              names.map((item, index) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-primary">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-primary">{item.vietnamese_name}</td>
                  <td className="px-4 py-3 text-lg font-medium text-primary">{item.katakana}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">Tổng cộng: {names.length} tên</p>
    </div>
  );
};

export default KatakanaTab;
