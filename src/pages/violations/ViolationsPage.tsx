import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Search, RefreshCw, Trash2, Edit, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatVietnameseDate } from "@/lib/vietnamese-utils";
import { useCanAction } from "@/hooks/useMenuPermissions";
import { Badge } from "@/components/ui/badge";
import { ExportButtonWithColumns } from '@/components/ui/export-button-with-columns';
import { EXPORT_CONFIGS } from '@/lib/export-configs';

interface BlacklistEntry {
  id: string;
  trainee_id: string;
  blacklist_reason: string | null;
  content: string;
  created_at: string;
  trainee?: {
    id: string;
    trainee_code: string;
    full_name: string;
  };
}

export default function ViolationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BlacklistEntry | null>(null);
  const [formData, setFormData] = useState({
    trainee_code: "",
    blacklist_reason: "",
    content: "",
  });

  const { hasPermission: canCreate } = useCanAction("violations", "create");
  const { hasPermission: canUpdate } = useCanAction("violations", "update");
  const { hasPermission: canDelete } = useCanAction("violations", "delete");

  // Fetch blacklisted trainees from trainee_reviews where is_blacklisted = true
  const { data: blacklistEntries, isLoading, refetch } = useQuery({
    queryKey: ["blacklist-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainee_reviews")
        .select(`
          id,
          trainee_id,
          blacklist_reason,
          content,
          created_at,
          trainee:trainees!trainee_reviews_trainee_id_fkey(id, trainee_code, full_name)
        `)
        .eq("is_blacklisted", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as BlacklistEntry[];
    },
  });

  // Filter entries by search
  const filteredEntries = blacklistEntries?.filter(
    (entry) =>
      entry.trainee?.trainee_code?.toLowerCase().includes(search.toLowerCase()) ||
      entry.trainee?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      entry.blacklist_reason?.toLowerCase().includes(search.toLowerCase())
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { trainee_id: string; blacklist_reason: string; content: string }) => {
      const { error } = await supabase.from("trainee_reviews").insert({
        trainee_id: data.trainee_id,
        blacklist_reason: data.blacklist_reason,
        content: data.content,
        is_blacklisted: true,
        review_type: "blacklist",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blacklist-entries"] });
      toast.success("Đã thêm vào danh sách đen");
      setFormOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; blacklist_reason: string; content: string }) => {
      const { error } = await supabase
        .from("trainee_reviews")
        .update({
          blacklist_reason: data.blacklist_reason,
          content: data.content,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blacklist-entries"] });
      toast.success("Đã cập nhật thành công");
      setFormOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  // Delete mutation (remove from blacklist)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trainee_reviews")
        .update({ is_blacklisted: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blacklist-entries"] });
      toast.success("Đã xóa khỏi danh sách đen");
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
    },
    onError: (error: Error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ trainee_code: "", blacklist_reason: "", content: "" });
    setSelectedEntry(null);
  };

  const handleAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (entry: BlacklistEntry) => {
    setSelectedEntry(entry);
    setFormData({
      trainee_code: entry.trainee?.trainee_code || "",
      blacklist_reason: entry.blacklist_reason || "",
      content: entry.content || "",
    });
    setFormOpen(true);
  };

  const handleDelete = (entry: BlacklistEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.content.trim()) {
      toast.error("Vui lòng nhập lý do");
      return;
    }

    if (selectedEntry) {
      // Update existing
      updateMutation.mutate({
        id: selectedEntry.id,
        blacklist_reason: formData.blacklist_reason,
        content: formData.content,
      });
    } else {
      // Create new - find trainee by code first
      if (!formData.trainee_code.trim()) {
        toast.error("Vui lòng nhập mã học viên");
        return;
      }

      const { data: trainee, error } = await supabase
        .from("trainees")
        .select("id")
        .eq("trainee_code", formData.trainee_code.toUpperCase())
        .single();

      if (error || !trainee) {
        toast.error("Không tìm thấy học viên với mã này");
        return;
      }

      createMutation.mutate({
        trainee_id: trainee.id,
        blacklist_reason: formData.blacklist_reason,
        content: formData.content,
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Quản lý</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-primary uppercase">Danh sách đen (Blacklist)</span>
        </div>
        {canCreate && (
          <Button onClick={handleAdd} className="bg-destructive hover:bg-destructive/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            THÊM VÀO BLACKLIST
          </Button>
        )}
        <ExportButtonWithColumns
          menuKey="violations"
          tableName="trainee_reviews"
          allColumns={EXPORT_CONFIGS.violations.columns}
          fileName={EXPORT_CONFIGS.violations.fileName}
          selectQuery="trainee:trainees(trainee_code, full_name), content, blacklist_reason, is_blacklisted, created_at"
          filters={{ is_blacklisted: true }}
          title="Xuất danh sách blacklist"
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã học viên, tên, lý do..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredEntries?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có ai trong danh sách đen</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-14 font-semibold text-foreground">STT</TableHead>
                <TableHead className="font-semibold text-foreground">MÃ HỌC VIÊN</TableHead>
                <TableHead className="font-semibold text-foreground">HỌ VÀ TÊN</TableHead>
                <TableHead className="font-semibold text-foreground">LÝ DO BLACKLIST</TableHead>
                <TableHead className="font-semibold text-foreground">NGÀY THÊM</TableHead>
                <TableHead className="font-semibold text-foreground text-center">THAO TÁC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries?.map((entry, index) => (
                <TableRow key={entry.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-center">{index + 1}</TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="font-mono">
                      {entry.trainee?.trainee_code || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {entry.trainee?.full_name || "-"}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate" title={entry.blacklist_reason || entry.content}>
                      {entry.blacklist_reason || entry.content || "-"}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatVietnameseDate(entry.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? "Cập nhật Blacklist" : "Thêm vào Blacklist"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trainee_code">Mã học viên</Label>
              <Input
                id="trainee_code"
                value={formData.trainee_code}
                onChange={(e) => setFormData({ ...formData, trainee_code: e.target.value.toUpperCase() })}
                placeholder="VD: TTS001"
                disabled={!!selectedEntry}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blacklist_reason">Phân loại lý do</Label>
              <Input
                id="blacklist_reason"
                value={formData.blacklist_reason}
                onChange={(e) => setFormData({ ...formData, blacklist_reason: e.target.value })}
                placeholder="VD: Vi phạm nội quy, Bỏ trốn..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Chi tiết lý do *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Mô tả chi tiết lý do đưa vào blacklist..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {createMutation.isPending || updateMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khỏi danh sách đen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa <strong>{selectedEntry?.trainee?.full_name}</strong> ({selectedEntry?.trainee?.trainee_code}) khỏi danh sách đen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedEntry && deleteMutation.mutate(selectedEntry.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
