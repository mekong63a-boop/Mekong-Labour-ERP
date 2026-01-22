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
import { Plus, Search, BookOpen, FileText, DollarSign, Heart, Pencil, Trash2, Image, ExternalLink, Users, GraduationCap, FileCheck, Plane } from 'lucide-react';
import { useCanAction } from '@/hooks/useMenuPermissions';
import {
  useHandbookEntries,
  useCreateHandbookEntry,
  useUpdateHandbookEntry,
  useDeleteHandbookEntry,
  HandbookEntry,
} from '@/hooks/useHandbook';
import { HandbookEntryDialog } from '@/components/handbook/HandbookEntryDialog';

// Phase configuration with colors, icons, and sub-items based on real XKLĐ Japan process
const PHASES = [
  {
    id: 'phase-1',
    category: 'Giai đoạn I - Tiếp cận và tư vấn',
    title: 'GIAI ĐOẠN I',
    subtitle: 'TIẾP CẬN VÀ TƯ VẤN ỨNG VIÊN',
    icon: Users,
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    subItems: [
      'Hình thức tiếp cận Online và Offline',
      'Tư vấn chương trình (TTS, KND, Kỹ sư, Du học)',
      'Đăng ký hồ sơ & Khám sức khỏe sơ bộ',
    ],
  },
  {
    id: 'phase-2',
    category: 'Giai đoạn II - Đào tạo và phỏng vấn',
    title: 'GIAI ĐOẠN II',
    subtitle: 'ĐÀO TẠO VÀ PHỎNG VẤN',
    icon: GraduationCap,
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500',
    textColor: 'text-green-600',
    lightBg: 'bg-green-50 dark:bg-green-950/30',
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
    title: 'GIAI ĐOẠN III',
    subtitle: 'HOÀN THIỆN THỦ TỤC PHÁP LÝ',
    icon: FileCheck,
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-600',
    lightBg: 'bg-orange-50 dark:bg-orange-950/30',
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
    title: 'GIAI ĐOẠN IV',
    subtitle: 'XUẤT CẢNH VÀ HOÀN THÀNH HỢP ĐỒNG',
    icon: Plane,
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500',
    textColor: 'text-red-600',
    lightBg: 'bg-red-50 dark:bg-red-950/30',
    subItems: [
      'Xuất cảnh sang Nhật làm việc',
      'Hết hợp đồng: Gia hạn/Chuyển diện Tokutei hoặc Về nước',
    ],
  },
];

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

  // Group entries by phase category
  const getEntriesByPhase = (phaseCategory: string) => {
    return entries.filter(entry => 
      entry.category?.toLowerCase().includes(phaseCategory.toLowerCase().split(' - ')[1] || phaseCategory.toLowerCase())
    );
  };

  // Get entries not matching any phase (for "Khác" category)
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

  const renderEntryContent = (entry: HandbookEntry) => (
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
  );

  const renderPhaseSection = (phase: typeof PHASES[0], phaseEntries: HandbookEntry[]) => {
    const PhaseIcon = phase.icon;
    
    return (
      <div key={phase.id} className={`border-l-4 ${phase.borderColor} bg-card rounded-xl overflow-hidden shadow-sm`}>
        {/* Phase Header */}
        <div className={`${phase.bgColor} text-white px-6 py-4`}>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-3">
              <PhaseIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{phase.title}</h2>
              <p className="text-white/90 text-sm">{phase.subtitle}</p>
            </div>
            <div className="ml-auto bg-white/20 rounded-full px-3 py-1 text-sm font-medium">
              {phaseEntries.length} mục
            </div>
          </div>
        </div>

        {/* Phase Content */}
        {phaseEntries.length === 0 ? (
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4 text-center">Chưa có nội dung cho giai đoạn này</p>
            
            {/* Show expected sub-items as guide */}
            {phase.subItems && phase.subItems.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Các mục cần thêm:</p>
                <ul className="space-y-1.5">
                  {phase.subItems.map((item, idx) => (
                    <li key={idx} className={`flex items-center gap-2 text-sm ${phase.textColor}`}>
                      <span className={`${phase.bgColor}/20 ${phase.textColor} rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium`}>
                        {idx + 1}
                      </span>
                      <span className="text-foreground/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {canCreate && (
              <div className="text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm nội dung
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Accordion type="multiple" className="divide-y">
            {phaseEntries.map((entry, index) => (
              <AccordionItem key={entry.id} value={entry.id} className="border-0">
                <div className="flex items-center">
                  <AccordionTrigger className="flex-1 px-6 py-4 hover:no-underline hover:bg-muted/30">
                    <div className="flex items-center gap-3 text-left">
                      <span className={`${phase.bgColor} text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-medium`}>
                        {index + 1}
                      </span>
                      <span className="font-medium">{entry.title}</span>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="hidden sm:flex gap-1">
                          {entry.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className={`${phase.lightBg} ${phase.textColor} text-xs px-2 py-0.5 rounded`}>
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
                  {renderEntryContent(entry)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    );
  };

  const otherEntries = getOtherEntries();

  return (
    <div className="min-h-screen">
      {/* Hero Section - Mekong Style */}
      <div className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 text-white py-12 px-6 -mx-6 -mt-6 mb-8 overflow-hidden">
        {/* Light beam effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-white/20 via-white/5 to-transparent"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Flags */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇻🇳</span>
              <span className="text-white/80">Việt Nam</span>
            </div>
            <div className="w-8 h-0.5 bg-white/40"></div>
            <div className="flex items-center gap-2">
              <span className="text-white/80">日本</span>
              <span className="text-2xl">🇯🇵</span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
            Chào Mừng Đối Tác!
            <br />
            <span className="text-yellow-300">Cùng Mekong Kiến Tạo Tương Lai</span>
            <br />
            Cho Lao Động Việt
          </h1>
          
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Cẩm nang tư vấn dành cho cộng tác viên - Hướng dẫn chi tiết quy trình tuyển dụng, 
            đào tạo và xuất cảnh lao động sang Nhật Bản
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <Skeleton className="h-16 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 && !debouncedSearch ? (
        <div className="bg-card border rounded-xl py-16 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Chưa có nội dung</h3>
          <p className="text-muted-foreground mb-6">
            Bắt đầu thêm nội dung quy trình tuyển dụng cho từng giai đoạn
          </p>
          {canCreate && (
            <Button onClick={() => setDialogOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Thêm mục đầu tiên
            </Button>
          )}
        </div>
      ) : debouncedSearch && entries.length === 0 ? (
        <div className="bg-card border rounded-xl py-16 text-center">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Không tìm thấy kết quả</h3>
          <p className="text-muted-foreground">
            Thử tìm kiếm với từ khóa khác
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4 Phases */}
          {PHASES.map((phase) => {
            const phaseEntries = getEntriesByPhase(phase.category);
            return renderPhaseSection(phase, phaseEntries);
          })}

          {/* Other entries not matching any phase */}
          {otherEntries.length > 0 && (
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted/50 px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
                  <span className="bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    {otherEntries.length}
                  </span>
                  Nội dung khác
                </h2>
              </div>
              <Accordion type="multiple" className="divide-y">
                {otherEntries.map((entry) => (
                  <AccordionItem key={entry.id} value={entry.id} className="border-0">
                    <div className="flex items-center">
                      <AccordionTrigger className="flex-1 px-6 py-4 hover:no-underline hover:bg-muted/30">
                        <div className="flex items-center gap-3 text-left">
                          <span className="font-medium text-lg">{entry.title}</span>
                          {entry.category && (
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded">
                              {entry.category}
                            </span>
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
                      {renderEntryContent(entry)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
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
