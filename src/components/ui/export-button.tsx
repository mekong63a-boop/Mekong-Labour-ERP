import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useExportExcel, ExportColumn } from '@/hooks/useExportExcel';

interface ExportButtonProps {
  menuKey: string;
  tableName: string;
  columns: ExportColumn[];
  fileName: string;
  selectQuery?: string;
  filters?: Record<string, any>;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  className?: string;
}

/**
 * Nút xuất Excel với phân quyền theo menu
 * - Tự động ẩn nếu user không có quyền xem menu
 * - Hiển thị loading khi đang xuất
 * - Hỗ trợ custom filters từ UI
 */
export function ExportButton({
  menuKey,
  tableName,
  columns,
  fileName,
  selectQuery,
  filters,
  variant = 'outline',
  size = 'sm',
  label = 'Xuất Excel',
  className,
}: ExportButtonProps) {
  const { exportToExcel, isExporting, canExport } = useExportExcel({
    menuKey,
    tableName,
    columns,
    fileName,
    selectQuery,
    filters,
  });

  // Ẩn nút nếu không có quyền
  if (!canExport) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={exportToExcel}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  );
}
