import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, BookOpen, FileText, DollarSign, Heart, Pencil, Trash2, Image, ExternalLink, Users, GraduationCap, FileCheck, Plane, ChevronRight, Check } from 'lucide-react';
import { useCanAction } from '@/hooks/useMenuPermissions';
import {
  useHandbookEntries,
  useCreateHandbookEntry,
  useUpdateHandbookEntry,
  useDeleteHandbookEntry,
  HandbookEntry,
} from '@/hooks/useHandbook';
import { HandbookEntryDialog } from '@/components/handbook/HandbookEntryDialog';

// Phase configuration with semantic colors
const PHASES = [
  {
    id: 'phase-1',
    category: 'Giai đoạn I - Tiếp cận và tư vấn',
    numeral: 'I',
    title: 'Tiếp cận và tư vấn',
    icon: Users,
    color: 'blue',
    subItems: [
      'Hình thức tiếp cận Online và Offline',
      'Tư vấn chương trình (TTS, KND, Kỹ sư, Du học)',
      'Đăng ký hồ sơ & Khám sức khỏe sơ bộ',
    ],
  },
  {
    id: 'phase-2',
    category: 'Giai đoạn II - Đào tạo và phỏng vấn',
    numeral: 'II',
    title: 'Đào tạo và phỏng vấn',
    icon: GraduationCap,
    color: 'green',
    subItems: [
      'Đăng ký nhập học tại trung tâm',
      'Đào tạo tác phong, kỷ luật Nhật Bản',
      'Kỹ năng phỏng vấn & tự giới thiệu',
      'Phỏng vấn trực tiếp/online với Xí nghiệp/Nghiệp đoàn',
      'Họp phụ huynh sau khi đậu phỏng vấn',
      'Hoàn thiện hồ sơ gửi sang Nhật Bản',
    ],
  },
  {
    id: 'phase-3',
    category: 'Giai đoạn III - Thủ tục pháp lý',
    numeral: 'III',
    title: 'Thủ tục pháp lý',
    icon: FileCheck,
    color: 'orange',
    subItems: [
      'Đào tạo ngoại ngữ chuyên ngành (N5/N4)',
      'Làm hồ sơ xin COE (Giấy chứng nhận tư cách lưu trú)',
      'Xin VISA tại Đại sứ quán Nhật Bản',
      'Họp phụ huynh trước xuất cảnh',
    ],
  },
  {
    id: 'phase-4',
    category: 'Giai đoạn IV - Xuất cảnh và hoàn thành',
    numeral: 'IV',
    title: 'Xuất cảnh và hoàn thành',
    icon: Plane,
    color: 'red',
    subItems: [
      'Xuất cảnh sang Nhật làm việc',
      'Hết hợp đồng: Gia hạn/Chuyển diện Tokutei hoặc Về nước',
    ],
  },
];

// Color utility functions
const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; border: string; text: string; light: string; ring: string }> = {
    blue: {
      bg: 'bg-blue-500',
      border: 'border-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      light: 'bg-blue-50 dark:bg-blue-950/40',
      ring: 'ring-blue-500/20',
    },
    green: {
      bg: 'bg-green-500',
      border: 'border-green-500',
      text: 'text-green-600 dark:text-green-400',
      light: 'bg-green-50 dark:bg-green-950/40',
      ring: 'ring-green-500/20',
    },
    orange: {
      bg: 'bg-orange-500',
      border: 'border-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
      light: 'bg-orange-50 dark:bg-orange-950/40',
      ring: 'ring-orange-500/20',
    },
    red: {
      bg: 'bg-red-500',
      border: 'border-red-500',
      text: 'text-red-600 dark:text-red-400',
      light: 'bg-red-50 dark:bg-red-950/40',
      ring: 'ring-red-500/20',
    },
  };
  return colorMap[color] || colorMap.blue;
};

export default function HandbookPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HandbookEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<HandbookEntry | null>(null);
  const [detailEntry, setDetailEntry] = useState<HandbookEntry | null>(null);
  const [detailPhaseColor, setDetailPhaseColor] = useState<string>('blue');

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

  // Group entries by phase category
  const getEntriesByPhase = (phaseCategory: string) => {
    return entries.filter(entry => 
      entry.category?.toLowerCase().includes(phaseCategory.toLowerCase().split(' - ')[1] || phaseCategory.toLowerCase())
    );
  };

  // Get entries not matching any phase
  const getOtherEntries = () => {
    const phaseKeywords = PHASES.map(p => p.category.toLowerCase().split(' - ')[1] || '');
    return entries.filter(entry => {
      const category = entry.category?.toLowerCase() || '';
      return !phaseKeywords.some(keyword => keyword && category.includes(keyword));
    });
  };

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
      setDetailEntry(null);
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

  const openDetail = (entry: HandbookEntry, color: string) => {
    setDetailEntry(entry);
    setDetailPhaseColor(color);
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const name = parts[parts.length - 1];
    return decodeURIComponent(name.replace(/^\d+_/, '')).substring(0, 40);
  };

  const otherEntries = getOtherEntries();

  // Detail Dialog Content
  const renderDetailContent = (entry: HandbookEntry) => {
    const colors = getColorClasses(detailPhaseColor);
    
    return (
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
          {entry.cost_info && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300 mb-2">
                <DollarSign className="h-5 w-5" />
                Chi phí tham gia
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap">
                {entry.cost_info}
              </div>
            </div>
          )}

          {entry.support_policy && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-300 mb-2">
                <Heart className="h-5 w-5" />
                Chính sách hỗ trợ
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 whitespace-pre-wrap">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {entry.image_urls.map((url, idx) => (
                <a 
                  key={idx} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative aspect-video rounded-lg overflow-hidden border bg-muted"
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
              Tài liệu đính kèm
            </h4>
            <div className="grid gap-2">
              {entry.document_urls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted/50 border rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className={`${colors.light} ${colors.text} rounded p-2`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">
                    {getFileName(url)}
                  </span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {entry.tags.map((tag) => (
              <span key={tag} className={`${colors.light} ${colors.text} text-xs px-2.5 py-1 rounded-full`}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 text-white py-10 px-6 -mx-6 -mt-6 mb-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <span className="text-2xl">🇻🇳</span>
            <div className="w-8 h-0.5 bg-white/40"></div>
            <span className="text-2xl">🇯🇵</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            Cẩm Nang Tư Vấn XKLĐ Nhật Bản
          </h1>
          
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Hướng dẫn chi tiết quy trình từ tuyển dụng đến xuất cảnh
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm nội dung..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-11 text-foreground bg-background border-0 shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {canCreate && (
        <div className="flex justify-end mb-6">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm nội dung
          </Button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 && !debouncedSearch ? (
        <div className="bg-card border rounded-xl py-16 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Chưa có nội dung</h3>
          <p className="text-muted-foreground mb-6">
            Bắt đầu thêm nội dung cho từng giai đoạn
          </p>
          {canCreate && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm mục đầu tiên
            </Button>
          )}
        </div>
      ) : debouncedSearch && entries.length === 0 ? (
        <div className="bg-card border rounded-xl py-16 text-center">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Không tìm thấy kết quả</h3>
          <p className="text-muted-foreground">Thử tìm với từ khóa khác</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border hidden md:block" />

          {/* Phases */}
          <div className="space-y-8">
            {PHASES.map((phase, phaseIndex) => {
              const phaseEntries = getEntriesByPhase(phase.category);
              const colors = getColorClasses(phase.color);
              const PhaseIcon = phase.icon;
              const isLast = phaseIndex === PHASES.length - 1;

              return (
                <div key={phase.id} className="relative flex gap-4 md:gap-6">
                  {/* Timeline Marker */}
                  <div className="hidden md:flex flex-col items-center z-10">
                    <div className={`w-12 h-12 rounded-full ${colors.bg} text-white flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-background`}>
                      {phase.numeral}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 ${colors.bg} opacity-30 mt-2`} />
                    )}
                  </div>

                  {/* Phase Content */}
                  <div className="flex-1 min-w-0">
                    {/* Phase Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`md:hidden w-10 h-10 rounded-full ${colors.bg} text-white flex items-center justify-center font-bold shadow`}>
                        {phase.numeral}
                      </div>
                      <div className="flex-1">
                        <h2 className={`text-lg font-bold ${colors.text}`}>
                          Giai đoạn {phase.numeral}: {phase.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {phaseEntries.length} nội dung
                        </p>
                      </div>
                      <PhaseIcon className={`h-6 w-6 ${colors.text} opacity-60`} />
                    </div>

                    {/* Cards Grid */}
                    {phaseEntries.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {phaseEntries.map((entry) => (
                          <Card
                            key={entry.id}
                            className={`group cursor-pointer transition-all hover:shadow-md hover:ring-2 ${colors.ring} border-l-4 ${colors.border}`}
                            onClick={() => openDetail(entry, phase.color)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-foreground">
                                  {entry.title}
                                </h3>
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                              
                              {/* Quick indicators */}
                              <div className="flex items-center gap-2 mt-3 text-muted-foreground">
                                {entry.cost_info && (
                                  <span title="Có thông tin chi phí"><DollarSign className="h-3.5 w-3.5" /></span>
                                )}
                                {entry.support_policy && (
                                  <span title="Có chính sách hỗ trợ"><Heart className="h-3.5 w-3.5" /></span>
                                )}
                                {entry.image_urls && entry.image_urls.length > 0 && (
                                  <span title="Có hình ảnh"><Image className="h-3.5 w-3.5" /></span>
                                )}
                                {entry.document_urls && entry.document_urls.length > 0 && (
                                  <span title="Có tài liệu"><FileText className="h-3.5 w-3.5" /></span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      /* Empty state with sub-items guide */
                      <Card className={`border-dashed ${colors.border} border-2`}>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-3">Các mục cần thêm:</p>
                          <ul className="space-y-2">
                            {phase.subItems.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <div className={`w-5 h-5 rounded-full ${colors.light} ${colors.text} flex items-center justify-center text-xs font-medium`}>
                                  {idx + 1}
                                </div>
                                <span className="text-foreground/70">{item}</span>
                              </li>
                            ))}
                          </ul>
                          {canCreate && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-4"
                              onClick={() => setDialogOpen(true)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Thêm nội dung
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Other entries */}
          {otherEntries.length > 0 && (
            <div className="mt-10 pt-8 border-t">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                Nội dung khác
                <span className="text-sm font-normal text-muted-foreground">({otherEntries.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherEntries.map((entry) => (
                  <Card
                    key={entry.id}
                    className="group cursor-pointer transition-all hover:shadow-md"
                    onClick={() => openDetail(entry, 'blue')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm leading-tight line-clamp-2">
                          {entry.title}
                        </h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      {entry.category && (
                        <span className="inline-block mt-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {entry.category}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailEntry} onOpenChange={(open) => !open && setDetailEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailEntry && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <DialogTitle className="text-xl">{detailEntry.title}</DialogTitle>
                  {(canUpdate || canDelete) && (
                    <div className="flex gap-1">
                      {canUpdate && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            handleEdit(detailEntry);
                            setDetailEntry(null);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => handleDelete(detailEntry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </DialogHeader>
              {renderDetailContent(detailEntry)}
            </>
          )}
        </DialogContent>
      </Dialog>

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
