import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

/**
 * VIRTUAL TABLE COMPONENT
 * 
 * QUY TẮC VÀNG #3: Scalability - Thiết kế cho hàng triệu records
 * 
 * Sử dụng @tanstack/react-virtual để render hiệu quả với dữ liệu lớn.
 * Chỉ render các rows visible trong viewport.
 */

export interface VirtualTableColumn<T> {
  key: string;
  header: string;
  width?: string | number;
  minWidth?: number;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  rowHeight?: number;
  containerHeight?: number | string;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: string | ((item: T, index: number) => string);
  emptyMessage?: string;
  getRowKey: (item: T) => string;
  overscan?: number;
}

export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 48,
  containerHeight = 600,
  onRowClick,
  rowClassName,
  emptyMessage = "Không có dữ liệu",
  getRowKey,
  overscan = 5,
}: VirtualTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 border-b">
        <div className="flex">
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                "px-4 py-3 text-sm font-medium text-muted-foreground",
                column.headerClassName
              )}
              style={{
                width: column.width,
                minWidth: column.minWidth,
                flex: column.width ? "none" : "1",
              }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Scrolling Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          height: typeof containerHeight === "number" ? containerHeight : containerHeight,
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = data[virtualRow.index];
            const rowKey = getRowKey(item);
            const computedRowClassName =
              typeof rowClassName === "function"
                ? rowClassName(item, virtualRow.index)
                : rowClassName;

            return (
              <div
                key={rowKey}
                className={cn(
                  "flex border-b transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/50",
                  computedRowClassName
                )}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onRowClick?.(item, virtualRow.index)}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-sm flex items-center",
                      column.className
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                      flex: column.width ? "none" : "1",
                    }}
                  >
                    {column.render(item, virtualRow.index)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for creating virtual table columns
 */
export function useVirtualTableColumns<T>(
  columns: VirtualTableColumn<T>[]
): VirtualTableColumn<T>[] {
  return React.useMemo(() => columns, [columns]);
}
