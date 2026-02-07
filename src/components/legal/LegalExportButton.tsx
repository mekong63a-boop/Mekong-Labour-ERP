import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useCanAccessMenu } from '@/hooks/useMenuPermissions';
import { formatVietnameseDate, removeVietnameseDiacritics, formatJapaneseDate } from '@/lib/vietnamese-utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';

/**
 * 39 cột theo đúng thứ tự DOCUMENT_COLUMNS trong LegalPage
 * Bao gồm cả cột computed (tính toán từ dữ liệu khác)
 */
const LEGAL_EXPORT_COLUMNS = [
  { key: '_stt', label: 'STT', computed: true },
  { key: 'trainee_code', label: 'Mã HV' },
  { key: 'full_name', label: 'Họ và tên' },
  { key: '_full_name_no_diacritics', label: 'Họ và tên không dấu', computed: true },
  { key: 'furigana', label: 'Tên phiên âm' },
  { key: 'gender', label: 'Giới tính' },
  { key: 'birth_date', label: 'Ngày tháng năm sinh', format: 'date' },
  { key: '_birth_date_jp', label: 'Ngày sinh tiếng Nhật', computed: true },
  { key: 'birthplace', label: 'Nơi sinh' },
  { key: '_birthplace_no_diacritics', label: 'Nơi sinh không dấu', computed: true },
  { key: 'passport_number', label: 'Số hộ chiếu' },
  { key: 'passport_date', label: 'Ngày cấp HC', format: 'date' },
  { key: '_passport_date_jp', label: 'Ngày cấp HC (JP)', computed: true },
  { key: 'expected_entry_month', label: 'Ngày dự kiến XC' },
  { key: '_expected_entry_month_jp', label: 'Ngày dự kiến XC (JP)', computed: true },
  { key: 'legal_address_vn', label: 'Địa chỉ Việt' },
  { key: 'legal_address_jp', label: 'Địa chỉ Nhật' },
  { key: 'guarantor_name_vn', label: 'Tên người bảo lãnh VN' },
  { key: 'guarantor_name_jp', label: 'Tên người bảo lãnh JP' },
  { key: 'guarantor_phone', label: 'SĐT người bảo lãnh' },
  { key: 'high_school_name', label: 'Tên trường cấp 3' },
  { key: 'high_school_period', label: 'Thời gian học' },
  { key: 'jp_certificate_school', label: 'Trường chứng chỉ JP' },
  { key: 'jp_certificate_period', label: 'Thời gian học CC' },
  { key: 'jp_school_1', label: 'Tên trường JP 1' },
  { key: 'jp_course_1', label: 'Khóa học JP 1' },
  { key: 'jp_school_2', label: 'Tên trường JP 2' },
  { key: 'jp_course_2', label: 'Khóa học JP 2' },
  // Các cột pháp lý - chưa có trong DB, để placeholder
  { key: 'dkhd_submission_date', label: 'Ngày trình ĐKHĐ', format: 'date' },
  { key: 'dkhd_number', label: 'Số ĐKHĐ' },
  { key: 'dkhd_file_code', label: 'Mã HS ĐKHĐ' },
  { key: 'tpc_request_date', label: 'Ngày gửi xin TPC', format: 'date' },
  { key: 'tpc_cv_number', label: 'Số CV xin TPC' },
  { key: 'tpc_file_code', label: 'Mã HS xin TPC' },
  { key: 'ptl_number', label: 'Số PTL' },
  { key: 'document_status', label: 'Tình trạng' },
  { key: 'ptl_issue_date', label: 'Ngày cấp PTL', format: 'date' },
  { key: 'tpc_issue_date', label: 'Ngày cấp TPC', format: 'date' },
  { key: 'current_status', label: 'Hiện trạng' },
];

// Các cột DB cần select
const DB_COLUMNS = [
  'trainee_code',
  'full_name',
  'furigana',
  'gender',
  'birth_date',
  'birthplace',
  'passport_number',
  'passport_date',
  'expected_entry_month',
  'legal_address_vn',
  'legal_address_jp',
  'guarantor_name_vn',
  'guarantor_name_jp',
  'guarantor_phone',
  'high_school_name',
  'high_school_period',
  'jp_certificate_school',
  'jp_certificate_period',
  'jp_school_1',
  'jp_course_1',
  'jp_school_2',
  'jp_course_2',
  'document_status',
  // Các cột pháp lý mới (có thể chưa có trong DB)
  'dkhd_submission_date',
  'dkhd_number',
  'dkhd_file_code',
  'tpc_request_date',
  'tpc_cv_number',
  'tpc_file_code',
  'ptl_number',
  'ptl_issue_date',
  'tpc_issue_date',
  'current_status',
];

interface LegalExportButtonProps {
  companyId: string;
  companyCode: string;
  companyName: string;
  documentStatusFilter?: string;
}

export function LegalExportButton({
  companyId,
  companyCode,
  companyName,
  documentStatusFilter = 'all',
}: LegalExportButtonProps) {
  const { canExport, isLoading: permissionLoading } = useCanAccessMenu('legal');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(LEGAL_EXPORT_COLUMNS.map(c => c.key))
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleOpenDialog = () => {
    setSelectedColumns(new Set(LEGAL_EXPORT_COLUMNS.map(c => c.key)));
    setIsDialogOpen(true);
  };

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedColumns(new Set(LEGAL_EXPORT_COLUMNS.map(c => c.key)));
    } else {
      setSelectedColumns(new Set());
    }
  };

  /**
   * Tính toán giá trị cho các cột computed
   */
  const computeValue = (row: any, key: string, rowIndex: number): string => {
    switch (key) {
      case '_stt':
        return String(rowIndex + 1);
      case '_full_name_no_diacritics':
        return removeVietnameseDiacritics(row.full_name || '');
      case '_birth_date_jp':
        return formatJapaneseDate(row.birth_date);
      case '_birthplace_no_diacritics':
        return removeVietnameseDiacritics(row.birthplace || '');
      case '_passport_date_jp':
        return formatJapaneseDate(row.passport_date);
      case '_expected_entry_month_jp':
        // expected_entry_month có thể là "2026-06" format
        if (row.expected_entry_month) {
          // Nếu chỉ có năm-tháng thì format là YYYY年MM月
          const match = row.expected_entry_month.match(/^(\d{4})-(\d{2})$/);
          if (match) {
            return `${match[1]}年${match[2]}月`;
          }
          return formatJapaneseDate(row.expected_entry_month);
        }
        return '—';
      default:
        return '';
    }
  };

  const exportToExcel = useCallback(async () => {
    if (!canExport) {
      toast.error('Bạn không có quyền xuất dữ liệu này');
      return;
    }

    if (selectedColumns.size === 0) {
      toast.error('Vui lòng chọn ít nhất một cột để xuất');
      return;
    }

    setIsExporting(true);
    try {
      // Query dữ liệu
      let query = supabase
        .from('trainees')
        .select(DB_COLUMNS.join(', '))
        .eq('receiving_company_id', companyId)
        .eq('progression_stage', 'Đậu phỏng vấn')
        .order('full_name');

      // Filter theo document_status nếu không phải 'all'
      if (documentStatusFilter && documentStatusFilter !== 'all') {
        query = query.eq('document_status', documentStatusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.warning('Không có dữ liệu để xuất');
        return;
      }

      // Get selected columns theo đúng thứ tự
      const columnsToExport = LEGAL_EXPORT_COLUMNS.filter(c => selectedColumns.has(c.key));

      // Transform data
      const excelData = data.map((row, rowIndex) => {
        const excelRow: Record<string, any> = {};
        columnsToExport.forEach(col => {
          if (col.computed) {
            excelRow[col.label] = computeValue(row, col.key, rowIndex);
          } else {
            const value = row[col.key as keyof typeof row];
            if (col.format === 'date') {
              excelRow[col.label] = formatVietnameseDate(value as string);
            } else {
              excelRow[col.label] = value || '—';
            }
          }
        });
        return excelRow;
      });

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Hồ sơ');

      // Auto-width columns
      const colWidths = columnsToExport.map(col => ({
        wch: Math.max(col.label.length + 2, 15)
      }));
      ws['!cols'] = colWidths;

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const statusSuffix = documentStatusFilter !== 'all' ? `-${documentStatusFilter}` : '-tat-ca';
      const fullFileName = `ho-so-${companyCode}${statusSuffix}_${dateStr}.xlsx`;

      XLSX.writeFile(wb, fullFileName);
      toast.success(`Đã xuất ${data.length} hồ sơ với ${columnsToExport.length} cột`);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất dữ liệu: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  }, [canExport, companyId, companyCode, documentStatusFilter, selectedColumns]);

  if (!canExport || permissionLoading) return null;

  const allSelected = selectedColumns.size === LEGAL_EXPORT_COLUMNS.length;
  const someSelected = selectedColumns.size > 0 && selectedColumns.size < LEGAL_EXPORT_COLUMNS.length;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenDialog}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Xuất Excel
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <DialogTitle>Xuất hồ sơ - {companyName}</DialogTitle>
            </div>
            <DialogDescription>
              Chọn các cột bạn muốn xuất ra file Excel ({LEGAL_EXPORT_COLUMNS.length} cột có sẵn)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Select all */}
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
              <Checkbox
                id="select-all"
                checked={allSelected}
                // @ts-ignore
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onCheckedChange={(checked) => toggleAll(!!checked)}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Chọn tất cả ({selectedColumns.size}/{LEGAL_EXPORT_COLUMNS.length})
              </label>
            </div>

            {/* Column list */}
            <ScrollArea className="h-[350px] border rounded-lg p-2">
              <div className="space-y-1">
                {LEGAL_EXPORT_COLUMNS.map((col) => (
                  <div 
                    key={col.key} 
                    className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded"
                  >
                    <Checkbox
                      id={col.key}
                      checked={selectedColumns.has(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                    <label htmlFor={col.key} className="text-sm cursor-pointer flex-1">
                      {col.label}
                    </label>
                    {col.computed && (
                      <span className="text-xs text-muted-foreground">(tự động)</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={exportToExcel}
              disabled={isExporting || selectedColumns.size === 0}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Xuất {selectedColumns.size} cột
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
