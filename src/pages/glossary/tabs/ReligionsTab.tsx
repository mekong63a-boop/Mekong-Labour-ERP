import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Save, X, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useCanAction } from "@/hooks/useMenuPermissions";
import * as XLSX from "xlsx";

interface Religion {
  id: string;
  name: string;
  created_at: string;
}

const ReligionsTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { hasPermission: canCreate } = useCanAction("glossary", "create");
  const { hasPermission: canUpdate } = useCanAction("glossary", "update");
  const { hasPermission: canDelete } = useCanAction("glossary", "delete");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["religions", search],
    queryFn: async () => {
      let query = supabase.from("religions").select("*").order("name");
      
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Religion[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const { error } = await supabase.from("religions").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["religions"] });
      toast.success("Đã thêm tôn giáo mới");
      resetForm();
    },
    onError: () => toast.error("Không thể thêm tôn giáo"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string }) => {
      const { error } = await supabase.from("religions").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["religions"] });
      toast.success("Đã cập nhật");
      resetForm();
    },
    onError: () => toast.error("Không thể cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("religions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["religions"] });
      toast.success("Đã xóa");
    },
    onError: () => toast.error("Không thể xóa"),
  });

  const resetForm = () => {
    setFormData({ name: "" });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEdit = (item: Religion) => {
    setEditingId(item.id);
    setFormData({ name: item.name });
    setShowAddForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Vui lòng điền tên tôn giáo");
      return;
    }

    if (!editingId) {
      const isDuplicate = items.some(
        (item) => item.name.toLowerCase() === formData.name.toLowerCase()
      );
      if (isDuplicate) {
        toast.error(`Tôn giáo "${formData.name}" đã tồn tại trong hệ thống!`);
        return;
      }
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };


  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const itemsToInsert = jsonData.map((row) => ({
        name: row["Tên tôn giáo"] || row.name || "",
      })).filter(s => s.name);

      if (itemsToInsert.length === 0) {
        toast.error("Không tìm thấy dữ liệu hợp lệ trong file");
        return;
      }

      const { error } = await supabase.from("religions").insert(itemsToInsert);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["religions"] });
      toast.success(`Đã import ${itemsToInsert.length} tôn giáo`);
    } catch (error: any) {
      toast.error("Lỗi khi import: " + error.message);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-800 flex items-center gap-2">
          <span>✨</span> Hướng dẫn
        </h3>
        <ul className="mt-2 text-sm text-amber-700 space-y-1">
          <li>• Quản lý danh sách tôn giáo</li>
          <li>• Các tôn giáo này sẽ hiển thị trong dropdown khi thêm học viên mới</li>
        </ul>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tôn giáo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 ml-auto">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleImport}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          {canCreate && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm tôn giáo mới
            </Button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">{editingId ? "Chỉnh sửa tôn giáo" : "Thêm tôn giáo mới"}</h3>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Tên tôn giáo (VD: Phật giáo, Công giáo...)"
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
              <th className="px-4 py-3 text-left text-sm font-medium text-primary">Tên tôn giáo</th>
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
                  Chưa có tôn giáo nào
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

      <p className="text-sm text-muted-foreground">Tổng cộng: {items.length} tôn giáo</p>
    </div>
  );
};

export default ReligionsTab;
