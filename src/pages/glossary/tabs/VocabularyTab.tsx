import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Save, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Vocabulary {
  id: string;
  vietnamese: string;
  japanese: string;
  category: string;
  created_at: string;
}

const categories = ["Chung", "Hồ sơ", "Y tế", "Địa danh", "Nghề nghiệp", "Học vấn"];

const VocabularyTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ vietnamese: "", japanese: "", category: "Chung" });

  const { data: vocabularies = [], isLoading } = useQuery({
    queryKey: ["vocabulary", search, categoryFilter],
    queryFn: async () => {
      let query = supabase.from("vocabulary").select("*").order("vietnamese");
      
      if (search) {
        query = query.or(`vietnamese.ilike.%${search}%,japanese.ilike.%${search}%`);
      }
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Vocabulary[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { vietnamese: string; japanese: string; category: string }) => {
      const { error } = await supabase.from("vocabulary").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      toast.success("Đã thêm từ vựng mới");
      resetForm();
    },
    onError: () => toast.error("Không thể thêm từ vựng"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; vietnamese: string; japanese: string; category: string }) => {
      const { error } = await supabase.from("vocabulary").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      toast.success("Đã cập nhật từ vựng");
      resetForm();
    },
    onError: () => toast.error("Không thể cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vocabulary").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      toast.success("Đã xóa từ vựng");
    },
    onError: () => toast.error("Không thể xóa"),
  });

  const resetForm = () => {
    setFormData({ vietnamese: "", japanese: "", category: "Chung" });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEdit = (item: Vocabulary) => {
    setEditingId(item.id);
    setFormData({ vietnamese: item.vietnamese, japanese: item.japanese, category: item.category });
    setShowAddForm(true);
  };

  const handleSubmit = () => {
    if (!formData.vietnamese || !formData.japanese) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm từ vựng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAddForm(true)} className="ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Thêm từ mới
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">{editingId ? "Chỉnh sửa từ" : "Thêm từ mới"}</h3>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Tiếng Việt"
              value={formData.vietnamese}
              onChange={(e) => setFormData({ ...formData, vietnamese: e.target.value })}
              className="flex-1"
            />
            <Input
              placeholder="Tiếng Nhật (日本語)"
              value={formData.japanese}
              onChange={(e) => setFormData({ ...formData, japanese: e.target.value })}
              className="flex-1"
            />
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <th className="px-4 py-3 text-left text-sm font-medium text-primary">Tiếng Việt</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-primary">Tiếng Nhật</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-primary">Danh mục</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-primary">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : vocabularies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Chưa có từ vựng nào
                </td>
              </tr>
            ) : (
              vocabularies.map((item, index) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-primary">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-primary">{item.vietnamese}</td>
                  <td className="px-4 py-3 text-sm text-primary text-lg">{item.japanese}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.category}</td>
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

      <p className="text-sm text-muted-foreground">Tổng cộng: {vocabularies.length} từ vựng</p>
    </div>
  );
};

export default VocabularyTab;
