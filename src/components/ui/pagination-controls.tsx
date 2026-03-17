import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  from: number;
  to: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  isLoading?: boolean;
  showPageSizeSelector?: boolean;
}

export const PaginationControls = React.forwardRef<HTMLDivElement, PaginationControlsProps>(function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  from,
  to,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  showPageSizeSelector = true,
}, ref) {
  // Generate page numbers to display (max 7 with ellipsis)
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3, 4, 5, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // In the middle
        pages.push('ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
      }
    }
    
    return pages;
  };

  const displayFrom = totalItems === 0 ? 0 : from + 1;
  const displayTo = Math.min(to + 1, totalItems);

  return (
    <div ref={ref} className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Info text */}
      <div className="text-sm text-muted-foreground">
        Hiển thị {displayFrom.toLocaleString('vi-VN')}-{displayTo.toLocaleString('vi-VN')} trong tổng số{' '}
        <span className="font-medium text-foreground">{totalItems.toLocaleString('vi-VN')}</span> học viên
      </div>

      {/* Page size selector + Navigation */}
      <div className="flex items-center gap-4">
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Hiển thị</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || isLoading}
            title="Trang đầu"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            title="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              page === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPageChange(page)}
                  disabled={isLoading}
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          {/* Mobile: Show current/total */}
          <span className="sm:hidden px-2 text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>

          {/* Next page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            title="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || isLoading}
            title="Trang cuối"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
