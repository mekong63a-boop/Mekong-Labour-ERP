import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Search, BookOpen, FileText, DollarSign, Heart, Pencil, Trash2, Image, ExternalLink } from 'lucide-react';
import { useCanAction } from '@/hooks/useMenuPermissions';
import {
  useHandbookEntries,
  useCreateHandbookEntry,
  useUpdateHandbookEntry,
  useDeleteHandbookEntry,
  HandbookEntry,
} from '@/hooks/useHandbook';
import { HandbookEntryDialog } from '@/components/handbook/HandbookEntryDialog';

export default function HandbookPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Group entries by category
  const groupedEntries = entries.reduce((acc, entry) => {
    const category = entry.category || 'Khác';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(entry);
    return acc;
  }, {} as Record<string, HandbookEntry[]>);

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

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const name = parts[parts.length - 1];
    return decodeURIComponent(name.replace(/^\d+_/, '')).substring(0, 40);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12 px-6 -mx-6 -mt-6 mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 rounded-full p-4">
              <BookOpen className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Cẩm nang tư vấn
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Tài liệu training cho cộng tác viên - Quy trình tuyển dụng, chi phí và chính sách hỗ trợ
          </p>
          
          {/* Search Box */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm nội dung, quy trình, chính sách..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-12 text-foreground bg-background border-0 shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {canCreate && (
        <div className="flex justify-end mb-6">
          <Button onClick={() => setDialogOpen(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Thêm nội dung mới
          </Button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <Skeleton className="h-8 w-1/3 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : Object.keys(groupedEntries).length === 0 ? (
        <div className="bg-card border rounded-xl py-16 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">
            {debouncedSearch ? 'Không tìm thấy kết quả' : 'Chưa có nội dung'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {debouncedSearch
              ? 'Thử tìm kiếm với từ khóa khác'
              : 'Bắt đầu thêm nội dung để training cho cộng tác viên'}
          </p>
          {canCreate && !debouncedSearch && (
            <Button onClick={() => setDialogOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Thêm mục đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([category, categoryEntries]) => (
            <div key={category} className="bg-card border rounded-xl overflow-hidden shadow-sm">
              {/* Category Header */}
              <div className="bg-muted/50 px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    {categoryEntries.length}
                  </span>
                  {category}
                </h2>
              </div>

              {/* Accordion for entries in this category */}
              <Accordion type="multiple" className="divide-y">
                {categoryEntries.map((entry) => (
                  <AccordionItem key={entry.id} value={entry.id} className="border-0">
                    <div className="flex items-center">
                      <AccordionTrigger className="flex-1 px-6 py-4 hover:no-underline hover:bg-muted/30">
                        <div className="flex items-center gap-3 text-left">
                          <span className="font-medium text-lg">{entry.title}</span>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="hidden sm:flex gap-1">
                              {entry.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionTrigger>
                      {(canUpdate || canDelete) && (
                        <div className="flex gap-1 pr-4">
                          {canUpdate && (
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(entry)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-6">
                        {/* Main Content */}
                        {entry.content && (
                          <div className="prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                              {entry.content}
                            </div>
                          </div>
                        )}

                        {/* Info Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Cost Info */}
                          {entry.cost_info && (
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                              <div className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300 mb-2">
                                <DollarSign className="h-5 w-5" />
                                Chi phí tham gia
                              </div>
                              <div className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap">
                                {entry.cost_info}
                              </div>
                            </div>
                          )}

                          {/* Support Policy */}
                          {entry.support_policy && (
                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4">
                              <div className="flex items-center gap-2 font-semibold text-green-800 dark:text-green-300 mb-2">
                                <Heart className="h-5 w-5" />
                                Chính sách hỗ trợ
                              </div>
                              <div className="text-sm text-green-700 dark:text-green-400 whitespace-pre-wrap">
                                {entry.support_policy}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Images Gallery */}
                        {entry.image_urls && entry.image_urls.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Image className="h-4 w-4" />
                              Hình ảnh minh họa
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {entry.image_urls.map((url, idx) => (
                                <a 
                                  key={idx} 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
                                >
                                  <img
                                    src={url}
                                    alt={`Hình ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Documents */}
                        {entry.document_urls && entry.document_urls.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Giấy tờ pháp lý & Tài liệu
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {entry.document_urls.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 bg-muted/50 border rounded-lg hover:bg-muted transition-colors group"
                                >
                                  <div className="bg-primary/10 text-primary rounded p-2">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <span className="flex-1 text-sm font-medium truncate">
                                    {getFileName(url)}
                                  </span>
                                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
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
