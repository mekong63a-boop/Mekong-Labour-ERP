import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Plus, 
  FileText, 
  DollarSign, 
  Heart, 
  Pencil, 
  Trash2, 
  Image, 
  ExternalLink,
  Users,
  GraduationCap,
  FileCheck,
  Plane,
  ArrowDown,
  Phone,
  ClipboardCheck,
  Stethoscope,
  BookOpen,
  MessageSquare,
  UserCheck,
  FileSignature,
  Globe,
  Award,
  Building2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useCanAction } from '@/hooks/useMenuPermissions';
import {
  useHandbookEntries,
  useCreateHandbookEntry,
  useUpdateHandbookEntry,
  useDeleteHandbookEntry,
  HandbookEntry,
} from '@/hooks/useHandbook';
import { HandbookEntryDialog } from '@/components/handbook/HandbookEntryDialog';
import mekongLogo from '@/assets/mekong-logo.png';

// Process flow configuration
const PROCESS_STEPS = [
  {
    phase: 1,
    title: 'TIẾP CẬN & TƯ VẤN',
    color: 'blue',
    icon: Users,
    steps: [
      { id: 'online', title: 'Tiếp cận Online', desc: 'Facebook, Zalo, Website', icon: Globe },
      { id: 'offline', title: 'Tiếp cận Offline', desc: 'Sự kiện, hội thảo địa phương', icon: Users },
      { id: 'consult', title: 'Tư vấn chương trình', desc: 'TTS, KND, Kỹ sư, Du học', icon: MessageSquare },
      { id: 'register', title: 'Đăng ký hồ sơ', desc: 'Thu thập thông tin cơ bản', icon: ClipboardCheck },
      { id: 'health', title: 'Khám sức khỏe sơ bộ', desc: 'Kiểm tra điều kiện cơ bản', icon: Stethoscope },
    ],
  },
  {
    phase: 2,
    title: 'ĐÀO TẠO & PHỎNG VẤN',
    color: 'green',
    icon: GraduationCap,
    steps: [
      { id: 'enroll', title: 'Nhập học tại trung tâm', desc: 'Bắt đầu khóa đào tạo', icon: BookOpen },
      { id: 'discipline', title: 'Đào tạo tác phong', desc: 'Kỷ luật, văn hóa Nhật', icon: UserCheck },
      { id: 'interview-skill', title: 'Kỹ năng phỏng vấn', desc: 'Tự giới thiệu, trả lời câu hỏi', icon: MessageSquare },
      { id: 'interview', title: 'Phỏng vấn xí nghiệp', desc: 'Trực tiếp hoặc Online', icon: Building2 },
      { id: 'parent-meeting', title: 'Họp phụ huynh', desc: 'Sau khi đậu phỏng vấn', icon: Users },
      { id: 'complete-docs', title: 'Hoàn thiện hồ sơ', desc: 'Gửi sang Nhật Bản', icon: FileSignature },
    ],
  },
  {
    phase: 3,
    title: 'THỦ TỤC PHÁP LÝ',
    color: 'orange',
    icon: FileCheck,
    steps: [
      { id: 'language', title: 'Đào tạo ngoại ngữ', desc: 'Tiếng Nhật N5/N4', icon: BookOpen },
      { id: 'coe', title: 'Xin COE', desc: 'Giấy chứng nhận tư cách lưu trú', icon: Award },
      { id: 'visa', title: 'Xin VISA', desc: 'Tại Đại sứ quán Nhật Bản', icon: FileCheck },
      { id: 'pre-departure', title: 'Họp phụ huynh', desc: 'Trước xuất cảnh', icon: Users },
    ],
  },
  {
    phase: 4,
    title: 'XUẤT CẢNH & HOÀN THÀNH',
    color: 'red',
    icon: Plane,
    steps: [
      { id: 'departure', title: 'Xuất cảnh', desc: 'Sang Nhật làm việc', icon: Plane },
      { id: 'completion', title: 'Hoàn thành hợp đồng', desc: 'Gia hạn/Tokutei/Về nước', icon: Award },
    ],
  },
];

const getPhaseColors = (color: string) => {
  const colorMap: Record<string, { bg: string; gradient: string; text: string; light: string; border: string }> = {
    blue: {
      bg: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
      text: 'text-blue-600 dark:text-blue-400',
      light: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-500',
    },
    green: {
      bg: 'bg-green-500',
      gradient: 'from-green-500 to-green-600',
      text: 'text-green-600 dark:text-green-400',
      light: 'bg-green-50 dark:bg-green-950/40',
      border: 'border-green-500',
    },
    orange: {
      bg: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600',
      text: 'text-orange-600 dark:text-orange-400',
      light: 'bg-orange-50 dark:bg-orange-950/40',
      border: 'border-orange-500',
    },
    red: {
      bg: 'bg-red-500',
      gradient: 'from-red-500 to-red-600',
      text: 'text-red-600 dark:text-red-400',
      light: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-500',
    },
  };
  return colorMap[color] || colorMap.blue;
};

export default function HandbookPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HandbookEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<HandbookEntry | null>(null);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<HandbookEntry | null>(null);

  const { data: entries = [] } = useHandbookEntries('');
  const createEntry = useCreateHandbookEntry();
  const updateEntry = useUpdateHandbookEntry();
  const deleteEntry = useDeleteHandbookEntry();

  const { hasPermission: canCreate } = useCanAction('handbook', 'create');
  const { hasPermission: canUpdate } = useCanAction('handbook', 'update');
  const { hasPermission: canDelete } = useCanAction('handbook', 'delete');

  // Find entries matching a step
  const getStepEntries = (stepId: string) => {
    return entries.filter(entry => 
      entry.title?.toLowerCase().includes(stepId.toLowerCase()) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(stepId.toLowerCase()))
    );
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

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const name = parts[parts.length - 1];
    return decodeURIComponent(name.replace(/^\d+_/, '')).substring(0, 40);
  };

  return (
    <div className="min-h-screen -mx-6 -mt-6">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
          {/* Decorative dots */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 rounded-full"></div>
          <div className="absolute top-40 right-40 w-3 h-3 bg-white/20 rounded-full"></div>
          <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-white/25 rounded-full"></div>
        </div>

        <div className="relative px-6 py-12 max-w-5xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={mekongLogo} alt="Mekong" className="h-16 w-auto" />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 leading-tight">
            <span className="text-yellow-300">Chào Mừng Đối Tác!</span>
            <br />
            Cùng Mekong Kiến Tạo Tương Lai
            <br />
            Cho Lao Động Việt
          </h1>

          {/* Flags */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <span className="text-3xl">🇻🇳</span>
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-3xl">🇯🇵</span>
          </div>

          {/* Description */}
          <p className="text-center text-white/90 max-w-2xl mx-auto mb-4 leading-relaxed">
            Cảm ơn bạn đã tin tưởng và lựa chọn đồng hành cùng Mekong. Chúng ta không chỉ là đối tác, 
            mà là những người cùng chung một sứ mệnh: mang đến cơ hội việc làm chất lượng cao tại Nhật Bản, 
            giúp thanh niên địa phương thay đổi cuộc sống và phát triển kinh tế quê hương.
          </p>

          <p className="text-center text-white/80 max-w-xl mx-auto text-sm">
            Cuốn cẩm nang này là công cụ dành riêng cho bạn, tổng hợp quy trình, thông tin và "bí quyết" 
            để triển khai công việc một cách hiệu quả nhất.
          </p>
        </div>

        {/* Bottom wave decoration */}
        <div className="h-16 bg-gradient-to-b from-transparent to-background"></div>
      </div>

      {/* Admin Actions */}
      {canCreate && (
        <div className="flex justify-end px-6 py-4">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm nội dung
          </Button>
        </div>
      )}

      {/* Process Flow Section */}
      <div className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Quy Trình XKLĐ Nhật Bản
            </h2>
            <p className="text-muted-foreground">
              Hành trình từ tuyển dụng đến xuất cảnh
            </p>
          </div>

          {/* Flow Chart */}
          <div className="space-y-6">
            {PROCESS_STEPS.map((phase, phaseIndex) => {
              const colors = getPhaseColors(phase.color);
              const PhaseIcon = phase.icon;
              const isLast = phaseIndex === PROCESS_STEPS.length - 1;

              return (
                <div key={phase.phase}>
                  {/* Phase Header */}
                  <div className={`relative bg-gradient-to-r ${colors.gradient} rounded-2xl p-5 text-white shadow-lg mb-4`}>
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 rounded-xl p-3">
                        <PhaseIcon className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="text-white/70 text-sm font-medium">Giai đoạn {phase.phase}</div>
                        <h3 className="text-xl font-bold">{phase.title}</h3>
                      </div>
                      <div className="ml-auto text-4xl font-bold text-white/20">
                        {String(phase.phase).padStart(2, '0')}
                      </div>
                    </div>
                  </div>

                  {/* Steps Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-4 border-l-4 ml-6" style={{ borderColor: `var(--${phase.color}-500, #3b82f6)` }}>
                    {phase.steps.map((step, stepIndex) => {
                      const StepIcon = step.icon;
                      const stepEntries = getStepEntries(step.id);
                      const hasContent = stepEntries.length > 0;

                      return (
                        <Card
                          key={step.id}
                          className={`group cursor-pointer transition-all hover:shadow-md border-l-4 ${colors.border} ${
                            selectedStep === step.id ? 'ring-2 ring-offset-2' : ''
                          }`}
                          style={{ borderLeftColor: `var(--${phase.color}-500, #3b82f6)` }}
                          onClick={() => {
                            setSelectedStep(step.id);
                            if (hasContent) {
                              setDetailEntry(stepEntries[0]);
                            }
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`${colors.light} ${colors.text} rounded-lg p-2 shrink-0`}>
                                <StepIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm mb-0.5 group-hover:text-foreground transition-colors">
                                  {step.title}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {step.desc}
                                </p>
                              </div>
                              {hasContent && (
                                <div className={`${colors.bg} text-white text-xs px-2 py-0.5 rounded-full shrink-0`}>
                                  {stepEntries.length}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Arrow to next phase */}
                  {!isLast && (
                    <div className="flex justify-center py-4">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <ArrowDown className="h-6 w-6 animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6 text-center">
                <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Phone className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-1">Hotline hỗ trợ</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">Liên hệ ngay khi cần</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6 text-center">
                <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-green-700 dark:text-green-300 mb-1">Chính sách hoa hồng</h3>
                <p className="text-sm text-green-600 dark:text-green-400">Minh bạch, rõ ràng</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6 text-center">
                <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-orange-700 dark:text-orange-300 mb-1">Cam kết đồng hành</h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">Suốt quá trình làm việc</p>
              </CardContent>
            </Card>
          </div>

          {/* All Entries Section */}
          {entries.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Tất cả nội dung ({entries.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entries.map((entry) => (
                  <Card
                    key={entry.id}
                    className="group cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setDetailEntry(entry)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {entry.title}
                        </h4>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      {entry.category && (
                        <span className="inline-block mt-2 text-xs bg-muted px-2 py-0.5 rounded">
                          {entry.category}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-muted-foreground">
                        {entry.cost_info && <span title="Chi phí"><DollarSign className="h-3.5 w-3.5" /></span>}
                        {entry.support_policy && <span title="Hỗ trợ"><Heart className="h-3.5 w-3.5" /></span>}
                        {entry.image_urls?.length > 0 && <span title="Hình ảnh"><Image className="h-3.5 w-3.5" /></span>}
                        {entry.document_urls?.length > 0 && <span title="Tài liệu"><FileText className="h-3.5 w-3.5" /></span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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

              <div className="space-y-6">
                {detailEntry.content && (
                  <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {detailEntry.content}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {detailEntry.cost_info && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300 mb-2">
                        <DollarSign className="h-5 w-5" />
                        Chi phí tham gia
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap">
                        {detailEntry.cost_info}
                      </div>
                    </div>
                  )}

                  {detailEntry.support_policy && (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-300 mb-2">
                        <Heart className="h-5 w-5" />
                        Chính sách hỗ trợ
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400 whitespace-pre-wrap">
                        {detailEntry.support_policy}
                      </div>
                    </div>
                  )}
                </div>

                {detailEntry.image_urls && detailEntry.image_urls.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Hình ảnh
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {detailEntry.image_urls.map((url, idx) => (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="group relative aspect-video rounded-lg overflow-hidden border bg-muted"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {detailEntry.document_urls && detailEntry.document_urls.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tài liệu
                    </h4>
                    <div className="grid gap-2">
                      {detailEntry.document_urls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-muted/50 border rounded-lg hover:bg-muted transition-colors group"
                        >
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="flex-1 text-sm font-medium truncate">{getFileName(url)}</span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {detailEntry.tags && detailEntry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {detailEntry.tags.map((tag) => (
                      <span key={tag} className="bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
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
              Bạn có chắc muốn xóa mục "{entryToDelete?.title}"?
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
