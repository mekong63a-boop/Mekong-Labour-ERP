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
import type { ExportColumn, ComputeType } from '@/lib/export-configs';

// Re-export the type for consumers
export type { ExportColumn };

interface ExportButtonWithColumnsProps {
  menuKey: string;
  tableName: string;
  allColumns: ExportColumn[];
  defaultColumns?: string[];
  fileName: string;
  selectQuery?: string;
  filters?: Record<string, any>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  title?: string;
}

/**
 * =============================================================================
 * EXPORT BUTTON - SINGLE SOURCE OF TRUTH
 * =============================================================================
 * 
 * Component CHUNG DUY NHẤT cho xuất Excel toàn hệ thống.
 * 
 * QUY TẮC BẤT DI BẤT DỊCH:
 * -------------------------
 * 1. TẤT CẢ menu đều dùng component này - KHÔNG tạo component export riêng
 * 2. Cấu hình cột nằm tại export-configs.ts - KHÔNG hardcode trong page
 * 3. Logic transform tập trung ở đây - KHÔNG phân tán ra nhiều file
 * 
 * CHỨC NĂNG:
 * - Kiểm tra quyền can_export trước khi hiển thị
 * - Dialog cho phép user chọn cột muốn xuất
 * - Hỗ trợ computed columns (STT, bỏ dấu, format Nhật...)
 * - Phân trang tự động cho dataset lớn (1000 records/page)
 * - Auto-width cột Excel
 * 
 * CẢNH BÁO: Tạo component export riêng cho menu sẽ phá vỡ Single Source of Truth!
 * =============================================================================
 */
export function ExportButtonWithColumns({
  menuKey,
  tableName,
  allColumns,
  defaultColumns,
  fileName,
  selectQuery,
  filters,
  variant = 'outline',
  size = 'sm',
  label = 'Xuất Excel',
  title = 'Xuất dữ liệu ra Excel',
}: ExportButtonWithColumnsProps) {
  const { canExport, isLoading: permissionLoading } = useCanAccessMenu(menuKey);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(defaultColumns || allColumns.map(c => c.key))
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleOpenDialog = () => {
    // Reset to default columns when opening
    setSelectedColumns(new Set(defaultColumns || allColumns.map(c => c.key)));
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
      setSelectedColumns(new Set(allColumns.map(c => c.key)));
    } else {
      setSelectedColumns(new Set());
    }
  };

  /**
   * Tính toán giá trị cho computed columns
   */
  const computeValue = (row: any, computeType: ComputeType, sourceField: string | undefined, rowIndex: number): string => {
    switch (computeType) {
      case 'row_index':
        return String(rowIndex + 1);

      case 'blank':
        return '—';

      case 'no_diacritics':
        if (!sourceField) return '';
        const sourceVal = getNestedValue(row, sourceField);
        return removeVietnameseDiacritics(sourceVal || '');

      case 'japanese_date':
        if (!sourceField) return '—';
        const dateVal = getNestedValue(row, sourceField);
        return formatJapaneseDate(dateVal);

      case 'japanese_month':
        if (!sourceField) return '—';
        const monthVal = getNestedValue(row, sourceField);
        if (!monthVal) return '—';
        // Format YYYY-MM -> YYYY年MM月
        const match = String(monthVal).match(/^(\d{4})-(\d{2})$/);
        if (match) {
          return `${match[1]}年${match[2]}月`;
        }
        // Fallback to full date format
        return formatJapaneseDate(monthVal);

      default:
        return '';
    }
  };

  // Helper: Convert column keys to Supabase select format
  // e.g., "receiving_company.name" -> "receiving_company:companies!fk_trainees_company(name)"
  const buildSelectQuery = (columns: ExportColumn[]): string => {
    const nestedRelations: Record<string, { fk: string; fields: string[] }> = {
      'receiving_company': { fk: 'companies!fk_trainees_company', fields: [] },
      'union': { fk: 'unions!fk_trainees_union', fields: [] },
      'job_category': { fk: 'job_categories!fk_trainees_job_category', fields: [] },
      'trainee': { fk: 'trainees', fields: [] },
      'member': { fk: 'union_members', fields: [] },
      'company': { fk: 'companies', fields: [] },
    };

    const directFields: string[] = [];
    const computedSourceFields: string[] = [];
    
     columns.forEach(col => {
       // Skip computed columns (they start with _ or have computeType)
       if (col.key.startsWith('_') || col.computeType) {
         // But we need the source field for computation
         if (col.computeFrom && !col.computeFrom.includes('.')) {
           computedSourceFields.push(col.computeFrom);
         }
         return;
       }
      
      if (col.key.includes('.')) {
        const [relation, field] = col.key.split('.');
        if (nestedRelations[relation]) {
          nestedRelations[relation].fields.push(field);
        } else {
          // Unknown relation, try generic format
          directFields.push(`${relation}(${field})`);
        }
      } else {
        directFields.push(col.key);
      }
    });

    // Add computed source fields if not already included
    computedSourceFields.forEach(field => {
      if (!directFields.includes(field)) {
        directFields.push(field);
      }
    });

    // Build relation queries
    const relationQueries: string[] = [];
    Object.entries(nestedRelations).forEach(([relation, config]) => {
      if (config.fields.length > 0) {
        relationQueries.push(`${relation}:${config.fk}(${config.fields.join(', ')})`);
      }
    });

    return [...directFields, ...relationQueries].join(', ');
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
      // Build query - tự động tạo selectQuery từ columns được chọn
      const columnsToExport = allColumns.filter(c => selectedColumns.has(c.key));
      const finalSelectQuery = selectQuery || buildSelectQuery(columnsToExport);
      
      let query = (supabase.from(tableName as any) as any).select(finalSelectQuery);

      // Apply filters from UI state
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            // Handle array values with .in() instead of .eq()
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      // Fetch all data with pagination for large datasets
      const PAGE_SIZE = 1000;
      let allData: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        
        allData = [...allData, ...(data || [])];
        hasMore = data?.length === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      if (allData.length === 0) {
        toast.warning('Không có dữ liệu để xuất');
        return;
      }

      // Transform data to Excel format with computed columns support
      const excelData = allData.map((row, rowIndex) => {
        const excelRow: Record<string, any> = {};
        columnsToExport.forEach(col => {
          // Handle computed columns
          if (col.computeType) {
            excelRow[col.label] = computeValue(row, col.computeType, col.computeFrom, rowIndex);
          } else {
            const value = getNestedValue(row, col.key);
            excelRow[col.label] = formatValue(value, col.format);
          }
        });
        return excelRow;
      });

      // Create workbook and export
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dữ liệu');

      // Auto-width columns
      const colWidths = columnsToExport.map(col => ({
        wch: Math.max(col.label.length + 2, 15)
      }));
      ws['!cols'] = colWidths;

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fullFileName = `${fileName}_${dateStr}.xlsx`;

      XLSX.writeFile(wb, fullFileName);
      toast.success(`Đã xuất ${allData.length} bản ghi với ${columnsToExport.length} cột`);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất dữ liệu: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  }, [canExport, tableName, selectQuery, filters, allColumns, selectedColumns, fileName]);

  // Don't render if no permission
  if (!canExport || permissionLoading) return null;

  const allSelected = selectedColumns.size === allColumns.length;
  const someSelected = selectedColumns.size > 0 && selectedColumns.size < allColumns.length;

  // Check if column is computed (for UI indicator)
  const isComputedColumn = (col: ExportColumn) => col.computeType !== undefined;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenDialog}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {label}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <DialogTitle>{title}</DialogTitle>
            </div>
            <DialogDescription>
              Chọn các cột bạn muốn xuất ra file Excel ({allColumns.length} cột có sẵn)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Select all */}
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
              <Checkbox
                id="select-all"
                checked={allSelected}
                // @ts-ignore - indeterminate works in browser
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onCheckedChange={(checked) => toggleAll(!!checked)}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Chọn tất cả ({selectedColumns.size}/{allColumns.length})
              </label>
            </div>

            {/* Column list */}
            <ScrollArea className="h-[350px] border rounded-lg p-2">
              <div className="space-y-1">
                {allColumns.map((col) => (
                  <div key={col.key} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={col.key}
                      checked={selectedColumns.has(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                    <label htmlFor={col.key} className="text-sm cursor-pointer flex-1">
                      {col.label}
                    </label>
                    {isComputedColumn(col) && (
                      <span className="text-xs text-muted-foreground">(tự động)</span>
                    )}
                    {col.format && (
                      <span className="text-xs text-muted-foreground">
                        ({col.format === 'date' ? 'Ngày' : col.format === 'currency' ? 'Tiền' : 'Số'})
                      </span>
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

/**
 * Helper: lấy giá trị từ nested object (vd: 'company.name')
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return null;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

/**
 * Helper: format giá trị theo type
 */
function formatValue(value: any, format?: string): any {
  if (value == null || value === '') return '—';
  
  switch (format) {
    case 'date':
      return formatVietnameseDate(value);
    case 'currency':
      return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
      }).format(value);
    case 'number':
      return typeof value === 'number' ? value : Number(value) || value;
    default:
      return String(value);
  }
}
