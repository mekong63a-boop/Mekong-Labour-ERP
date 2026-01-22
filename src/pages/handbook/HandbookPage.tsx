import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, BookOpen, Filter } from 'lucide-react';
import { useCanAction } from '@/hooks/useMenuPermissions';
import {
  useHandbookEntries,
  useCreateHandbookEntry,
  useUpdateHandbookEntry,
  useDeleteHandbookEntry,
  HandbookEntry,
} from '@/hooks/useHandbook';
import { HandbookEntryDialog } from '@/components/handbook/HandbookEntryDialog';
import { HandbookEntryCard } from '@/components/handbook/HandbookEntryCard';

export default function HandbookPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HandbookEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<HandbookEntry | null>(null);

  const { data: entries = [], isLoading } = useHandbookEntries(debouncedSearch);
  const createEntry = useCreateHandbookEntry();
  const updateEntry = useUpdateHandbookEntry();
  const deleteEntry = useDeleteHandbookEntry();

  const { hasPermission: canCreate } = useCanAction('handbook', 'create');
  const { hasPermission: canUpdate } = useCanAction('handbook', 'update');
  const { hasPermission: canDelete } = useCanAction('handbook', 'delete');

  // Debounce search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  // Get unique categories
  const categories = [...new Set(entries.filter(e => e.category).map(e => e.category!))];

  // Filter by category
  const filteredEntries = selectedCategory
    ? entries.filter(e => e.category === selectedCategory)
    : entries;

  const handleEdit = (entry: HandbookEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleDelete = (entry: HandbookEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      await deleteEntry.mutateAsync(entryToDelete.id);
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleSave = async (data: Partial<HandbookEntry>) => {
    if (editingEntry) {
      await updateEntry.mutateAsync({ id: editingEntry.id, ...data });
    } else {
      await createEntry.mutateAsync(data as any);
    }
    setEditingEntry(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingEntry(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Cẩm nang tư vấn
          </h1>
          <p className="text-muted-foreground">
            Tài liệu training cho cộng tác viên - quy trình, chi phí và chính sách hỗ trợ
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)} className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Thêm mục mới
          </Button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm nội dung, tiêu đề, tag..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              Tất cả
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {debouncedSearch ? 'Không tìm thấy kết quả' : 'Chưa có nội dung'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {debouncedSearch
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Bắt đầu thêm nội dung để training cho cộng tác viên'}
            </p>
            {canCreate && !debouncedSearch && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm mục đầu tiên
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <HandbookEntryCard
              key={entry.id}
              entry={entry}
              canEdit={canUpdate}
              canDelete={canDelete}
              onEdit={() => handleEdit(entry)}
              onDelete={() => handleDelete(entry)}
            />
          ))}
        </div>
      )}

      {/* Entry Dialog */}
      <HandbookEntryDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        entry={editingEntry}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa mục "{entryToDelete?.title}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
