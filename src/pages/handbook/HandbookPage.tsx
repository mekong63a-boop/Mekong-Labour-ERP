import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Sparkles,
  Plus,
  ChevronDown,
  ChevronUp,
  Landmark,
  X,
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
      { id: 'loan-policy', title: 'Chính sách hỗ trợ vay vốn', desc: 'NĐ 338/2025/NĐ-CP', icon: Landmark },
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

// Static content for loan policy from NĐ 338/2025/NĐ-CP
const LOAN_POLICY_CONTENT = {
  title: 'Nghị định 338/2025/NĐ-CP - Chính sách hỗ trợ vay vốn đi làm việc ở nước ngoài',
  summary: 'Nghị định quy định chi tiết một số điều của Luật Việc làm số 74/2025/QH15 về chính sách hỗ trợ tạo việc làm. Có hiệu lực từ ngày 01/01/2026.',
  sections: [
    {
      title: '1. Mức vay vốn đi làm việc ở nước ngoài (Điều 12)',
      content: `• Mức vay tối đa: 100% tổng chi phí người lao động phải trả trước khi đi làm việc ở nước ngoài theo hợp đồng (không bao gồm các khoản chi đã được ngân sách nhà nước hỗ trợ).
• Căn cứ vào nguồn vốn, tổng chi phí và khả năng trả nợ, Ngân hàng Chính sách xã hội thống nhất với người vay để quyết định mức vay cụ thể.`,
    },
    {
      title: '2. Điều kiện bảo đảm tiền vay (Điều 13)',
      content: `• Mức vay trên 200 triệu đồng: phải thực hiện bảo đảm tiền vay theo quy định pháp luật và hướng dẫn của Ngân hàng CSXH.
• Địa phương có thể quyết định mức vay phải bảo đảm cao hơn đối với nguồn vốn ngân sách ủy thác.`,
    },
    {
      title: '3. Thời hạn vay vốn (Điều 14)',
      content: `• Thời hạn vay tối đa bằng thời hạn hợp đồng đưa người lao động đi làm việc ở nước ngoài (không bao gồm thời gian gia hạn hợp đồng).`,
    },
    {
      title: '4. Lãi suất vay vốn (Điều 15)',
      content: `• Đối tượng thông thường: Lãi suất = 127% lãi suất cho vay hộ nghèo theo từng thời kỳ do Thủ tướng quy định.
• Đối tượng ưu tiên (người dân tộc thiểu số, hộ nghèo...): Lãi suất = lãi suất cho vay hộ nghèo.
• Lãi suất nợ quá hạn: 130% lãi suất vay vốn.`,
    },
    {
      title: '5. Hồ sơ vay vốn (Điều 16)',
      content: `1. Giấy đề nghị vay vốn (mẫu do NH CSXH ban hành)
2. Giấy tờ chứng minh đối tượng ưu tiên (nếu có): giấy tờ về dân tộc, cư trú, hộ nghèo
3. Bản sao hợp đồng đưa người lao động đi làm việc ở nước ngoài
4. Bản sao hộ chiếu còn hạn
5. Giấy tờ tài sản bảo đảm (nếu vay trên 200 triệu)
6. Văn bản hỗ trợ của cơ quan có thẩm quyền (nếu có)`,
    },
    {
      title: '6. Thủ tục giải quyết (Điều 17)',
      content: `• Người lao động nộp hồ sơ tại Ngân hàng Chính sách xã hội.
• Trong 07 ngày làm việc kể từ ngày nhận đủ hồ sơ, NH CSXH thông báo kết quả phê duyệt cho vay.
• Xử lý rủi ro theo quy định của NH CSXH.`,
    },
    {
      title: '7. Hỗ trợ người lao động đi làm việc ở nước ngoài (Điều 30)',
      content: `a) Giáo dục định hướng:
   • Hỗ trợ chi phí đào tạo: tối đa 530.000 đồng/người/khóa học
   • Hỗ trợ tiền ăn, sinh hoạt phí: 50.000 đồng/người/ngày
   • Hỗ trợ tiền ở: 400.000 đồng/người/tháng
   • Hỗ trợ tiền đi lại: 200.000-300.000 đồng/người/khóa học

b) Đào tạo nâng cao kỹ năng nghề, ngoại ngữ:
   • Hỗ trợ đào tạo kỹ năng nghề: tối đa 4 triệu đồng/người/khóa học
   • Hỗ trợ đào tạo ngoại ngữ: tối đa 4 triệu đồng/người/khóa học

c) Chi phí khác:
   • Lệ phí hộ chiếu: theo quy định pháp luật
   • Lệ phí lý lịch tư pháp: theo quy định
   • Lệ phí visa: theo quy định nước tiếp nhận
   • Chi phí khám sức khỏe: tối đa 750.000 đồng/người`,
    },
    {
      title: '8. Đối tượng được hỗ trợ (Điều 14 Luật Việc làm)',
      content: `• Người có công với cách mạng và thân nhân
• Người dân tộc thiểu số
• Người thuộc hộ nghèo, hộ cận nghèo
• Người có đất thu hồi
• Thanh niên hoàn thành nghĩa vụ quân sự, công an
• Thanh niên tình nguyện hoàn thành nhiệm vụ

Lưu ý: Người lao động chỉ được hưởng một lần nội dung hỗ trợ và chọn trường hợp có lợi nhất.`,
    },
    {
      title: '9. Hiệu lực thi hành (Điều 34)',
      content: `• Có hiệu lực từ ngày 01/01/2026
• Thay thế: Nghị định 61/2015/NĐ-CP và Nghị định 74/2019/NĐ-CP
• Các trường hợp đang hưởng chính sách cũ tiếp tục được hỗ trợ cho đến hết thời gian.`,
    },
  ],
};

const getPhaseColors = (color: string) => {
  const colorMap: Record<string, { bg: string; gradient: string; text: string; light: string; border: string; ring: string }> = {
    blue: {
      bg: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
      text: 'text-blue-600 dark:text-blue-400',
      light: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-500',
      ring: 'ring-blue-500',
    },
    green: {
      bg: 'bg-green-500',
      gradient: 'from-green-500 to-green-600',
      text: 'text-green-600 dark:text-green-400',
      light: 'bg-green-50 dark:bg-green-950/40',
      border: 'border-green-500',
      ring: 'ring-green-500',
    },
    orange: {
      bg: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600',
      text: 'text-orange-600 dark:text-orange-400',
      light: 'bg-orange-50 dark:bg-orange-950/40',
      border: 'border-orange-500',
      ring: 'ring-orange-500',
    },
    red: {
      bg: 'bg-red-500',
      gradient: 'from-red-500 to-red-600',
      text: 'text-red-600 dark:text-red-400',
      light: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-500',
      ring: 'ring-red-500',
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
  const [expandedLoanSection, setExpandedLoanSection] = useState<number | null>(null);

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
      entry.tags?.some(tag => tag.toLowerCase() === stepId.toLowerCase())
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
      // Auto-tag with current step
      const saveData = {
        ...data,
        tags: [...(data.tags || []), ...(selectedStep ? [selectedStep] : [])],
      };
      await createEntry.mutateAsync(saveData as any);
    }
    setEditingEntry(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingEntry(null);
    }
  };

  const handleStepClick = (stepId: string) => {
    if (selectedStep === stepId) {
      setSelectedStep(null);
    } else {
      setSelectedStep(stepId);
    }
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const name = parts[parts.length - 1];
    return decodeURIComponent(name.replace(/^\d+_/, '')).substring(0, 40);
  };

  // Render content panel for selected step
  const renderStepContent = (stepId: string, phaseColor: string) => {
    if (selectedStep !== stepId) return null;

    const colors = getPhaseColors(phaseColor);
    const stepEntries = getStepEntries(stepId);

    // Special case: loan policy
    if (stepId === 'loan-policy') {
      return (
        <div className="col-span-full mt-3 animate-in slide-in-from-top-2 duration-200">
          <Card className={`border-2 ${colors.border}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Landmark className={`h-5 w-5 ${colors.text}`} />
                  {LOAN_POLICY_CONTENT.title}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedStep(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mb-6 bg-muted/50 p-3 rounded-lg">
                {LOAN_POLICY_CONTENT.summary}
              </p>
              <div className="space-y-2">
                {LOAN_POLICY_CONTENT.sections.map((section, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <button
                      className={`w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors ${
                        expandedLoanSection === idx ? 'bg-muted/50' : ''
                      }`}
                      onClick={() => setExpandedLoanSection(expandedLoanSection === idx ? null : idx)}
                    >
                      <span className="font-medium text-sm">{section.title}</span>
                      {expandedLoanSection === idx ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    {expandedLoanSection === idx && (
                      <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150">
                        <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed bg-background p-3 rounded border">
                          {section.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Additional entries from DB */}
              {stepEntries.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium mb-3">Nội dung bổ sung</h4>
                  {stepEntries.map(entry => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onView={() => setDetailEntry(entry)}
                      onEdit={canUpdate ? () => handleEdit(entry) : undefined}
                      onDelete={canDelete ? () => handleDelete(entry) : undefined}
                    />
                  ))}
                </div>
              )}

              {canCreate && (
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm nội dung bổ sung
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    // Regular step content
    return (
      <div className="col-span-full mt-3 animate-in slide-in-from-top-2 duration-200">
        <Card className={`border-2 ${colors.border}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                Nội dung: {PROCESS_STEPS.flatMap(p => p.steps).find(s => s.id === stepId)?.title}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedStep(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {stepEntries.length > 0 ? (
              <div className="space-y-3">
                {stepEntries.map(entry => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onView={() => setDetailEntry(entry)}
                    onEdit={canUpdate ? () => handleEdit(entry) : undefined}
                    onDelete={canDelete ? () => handleDelete(entry) : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Chưa có nội dung cho bước này</p>
                <p className="text-sm mt-1">
                  {canCreate ? 'Nhấn nút bên dưới để thêm nội dung mới' : 'Liên hệ quản trị viên để thêm nội dung'}
                </p>
              </div>
            )}

            {canCreate && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm nội dung
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen -mx-6 -mt-6">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
          <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 rounded-full"></div>
          <div className="absolute top-40 right-40 w-3 h-3 bg-white/20 rounded-full"></div>
          <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-white/25 rounded-full"></div>
        </div>

        <div className="relative px-6 py-12 max-w-5xl mx-auto">
          <div className="flex justify-center mb-6">
            <img src={mekongLogo} alt="Mekong" className="h-16 w-auto" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 leading-tight">
            <span className="text-yellow-300">Chào Mừng Đối Tác!</span>
            <br />
            Cùng Mekong Kiến Tạo Tương Lai
            <br />
            Cho Lao Động Việt
          </h1>

          <div className="flex justify-center items-center gap-4 mb-6">
            <span className="text-3xl">🇻🇳</span>
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-3xl">🇯🇵</span>
          </div>

          <p className="text-center text-white/90 max-w-2xl mx-auto mb-4 leading-relaxed">
            Cảm ơn bạn đã tin tưởng và lựa chọn đồng hành cùng Mekong. Chúng ta không chỉ là đối tác, 
            mà là những người cùng chung một sứ mệnh: mang đến cơ hội việc làm chất lượng cao tại Nhật Bản, 
            giúp thanh niên địa phương thay đổi cuộc sống và phát triển kinh tế quê hương.
          </p>

          <p className="text-center text-white/80 max-w-xl mx-auto text-sm">
            Nhấp vào từng bước trong quy trình để xem nội dung chi tiết hướng dẫn.
          </p>
        </div>

        <div className="h-16 bg-gradient-to-b from-transparent to-background"></div>
      </div>

      {/* Process Flow Section */}
      <div className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Quy Trình XKLĐ Nhật Bản
            </h2>
            <p className="text-muted-foreground">
              Nhấp vào từng bước để xem nội dung chi tiết
            </p>
          </div>

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
                    {phase.steps.map((step) => {
                      const StepIcon = step.icon;
                      const stepEntries = getStepEntries(step.id);
                      const hasContent = stepEntries.length > 0 || step.id === 'loan-policy';
                      const isSelected = selectedStep === step.id;

                      return (
                        <Card
                          key={step.id}
                          className={`group cursor-pointer transition-all hover:shadow-md border-l-4 ${colors.border} ${
                            isSelected ? `ring-2 ${colors.ring} ring-offset-2 shadow-md` : ''
                          }`}
                          style={{ borderLeftColor: `var(--${phase.color}-500, #3b82f6)` }}
                          onClick={() => handleStepClick(step.id)}
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
                                  {step.id === 'loan-policy' ? '✓' : stepEntries.length}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <div className={`mt-2 text-xs ${colors.text} font-medium flex items-center gap-1`}>
                                <ChevronUp className="h-3 w-3" />
                                Đang xem
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Step content panel - rendered inside grid as full-width */}
                    {phase.steps.map((step) => renderStepContent(step.id, phase.color))}
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
        </div>
      </div>

      {/* Detail Dialog for viewing entry */}
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

// Entry card component for displaying individual entries in step content
function EntryCard({ 
  entry, 
  onView, 
  onEdit, 
  onDelete 
}: { 
  entry: HandbookEntry; 
  onView: () => void; 
  onEdit?: () => void; 
  onDelete?: () => void;
}) {
  return (
    <div 
      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onView}
    >
      <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{entry.title}</h4>
        {entry.content && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{entry.content}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-muted-foreground">
          {entry.cost_info && <DollarSign className="h-3.5 w-3.5" />}
          {entry.support_policy && <Heart className="h-3.5 w-3.5" />}
          {entry.image_urls?.length > 0 && <Image className="h-3.5 w-3.5" />}
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
