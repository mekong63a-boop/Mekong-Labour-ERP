import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useCanAccessMenu } from '@/hooks/useMenuPermissions';
import { formatVietnameseDate } from '@/lib/vietnamese-utils';
import { toast } from 'sonner';

export interface ExportColumn {
  key: string;
  label: string;
  format?: 'date' | 'number' | 'currency';
}

interface UseExportExcelOptions {
  menuKey: string;
  tableName: string;
  columns: ExportColumn[];
  fileName: string;
  selectQuery?: string;
  filters?: Record<string, any>;
}

/**
 * Hook xuất Excel với phân quyền theo menu
 * - Tự động kiểm tra quyền xem menu trước khi xuất
 * - Phân trang khi xuất lượng lớn (>1000 records)
 * - RLS tự động lọc dữ liệu theo quyền user
 */
export function useExportExcel(options: UseExportExcelOptions) {
  const { menuKey, tableName, columns, fileName, selectQuery, filters } = options;
  const { canExport, isLoading: permissionLoading } = useCanAccessMenu(menuKey);
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = useCallback(async () => {
    if (!canExport) {
      toast.error('Bạn không có quyền xuất dữ liệu này');
      return;
    }

    setIsExporting(true);
    try {
      // Build query - cast to any to handle dynamic table names
      let query = (supabase.from(tableName as any) as any).select(selectQuery || '*');

      // Apply filters from UI state
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            query = query.eq(key, value);
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

      // Transform data to Excel format
      const excelData = allData.map(row => {
        const excelRow: Record<string, any> = {};
        columns.forEach(col => {
          const value = getNestedValue(row, col.key);
          excelRow[col.label] = formatValue(value, col.format);
        });
        return excelRow;
      });

      // Create workbook and export
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dữ liệu');

      // Auto-width columns
      const colWidths = columns.map(col => ({
        wch: Math.max(col.label.length + 2, 15)
      }));
      ws['!cols'] = colWidths;

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fullFileName = `${fileName}_${dateStr}.xlsx`;

      XLSX.writeFile(wb, fullFileName);
      toast.success(`Đã xuất ${allData.length} bản ghi`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất dữ liệu: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  }, [canExport, tableName, selectQuery, filters, columns, fileName]);

  return {
    exportToExcel,
    isExporting,
    canExport: canExport && !permissionLoading,
  };
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
  if (value == null || value === '') return '';
  
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
