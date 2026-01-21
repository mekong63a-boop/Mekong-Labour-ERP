import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lock, Columns3, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { COLUMN_GROUPS } from "../types";

interface ReportColumnSelectorProps {
  selectedColumns: string[];
  onColumnsChange: (columns: string[]) => void;
  canViewPII: boolean;
}

export function ReportColumnSelector({ selectedColumns, onColumnsChange, canViewPII }: ReportColumnSelectorProps) {
  const toggleColumn = (columnKey: string) => {
    if (selectedColumns.includes(columnKey)) {
      onColumnsChange(selectedColumns.filter((c) => c !== columnKey));
    } else {
      onColumnsChange([...selectedColumns, columnKey]);
    }
  };

  const selectAllInGroup = (groupColumns: { key: string; isPII?: boolean }[]) => {
    const selectableColumns = groupColumns
      .filter((col) => !col.isPII || canViewPII)
      .map((col) => col.key);
    const allSelected = selectableColumns.every((key) => selectedColumns.includes(key));
    
    if (allSelected) {
      // Deselect all
      onColumnsChange(selectedColumns.filter((c) => !selectableColumns.includes(c)));
    } else {
      // Select all
      const newColumns = [...new Set([...selectedColumns, ...selectableColumns])];
      onColumnsChange(newColumns);
    }
  };

  const selectAll = () => {
    const allColumns = COLUMN_GROUPS.flatMap((group) =>
      group.columns.filter((col) => !col.isPII || canViewPII).map((col) => col.key)
    );
    onColumnsChange(allColumns);
  };

  const deselectAll = () => {
    onColumnsChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Columns3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Chọn cột xuất</h3>
          <Badge variant="secondary">{selectedColumns.length} cột</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            <CheckSquare className="h-4 w-4 mr-1" />
            Chọn tất cả
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            <Square className="h-4 w-4 mr-1" />
            Bỏ chọn
          </Button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["Thông tin học viên", "Trạng thái – Tiến trình"]} className="space-y-2">
        {COLUMN_GROUPS.map((group) => {
          const groupSelectedCount = group.columns.filter((col) => selectedColumns.includes(col.key)).length;
          const isPIIGroup = group.columns.some((col) => col.isPII);

          return (
            <AccordionItem key={group.name} value={group.name} className="border rounded-lg px-3">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{group.name}</span>
                  {isPIIGroup && !canViewPII && (
                    <Lock className="h-4 w-4 text-destructive" />
                  )}
                  {groupSelectedCount > 0 && (
                    <Badge variant="default" className="ml-2">
                      {groupSelectedCount}/{group.columns.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-2 h-7 text-xs"
                    onClick={() => selectAllInGroup(group.columns)}
                  >
                    Chọn/bỏ tất cả nhóm này
                  </Button>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {group.columns.map((column) => {
                      const isDisabled = column.isPII && !canViewPII;
                      const isChecked = selectedColumns.includes(column.key);

                      return (
                        <div key={column.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={column.key}
                            checked={isChecked}
                            disabled={isDisabled}
                            onCheckedChange={() => toggleColumn(column.key)}
                          />
                          <Label
                            htmlFor={column.key}
                            className={`text-sm cursor-pointer ${isDisabled ? "text-muted-foreground line-through" : ""}`}
                          >
                            {column.label}
                            {column.isPII && (
                              <Lock className="inline h-3 w-3 ml-1 text-destructive" />
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {!canViewPII && (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Lock className="h-4 w-4" />
          Các cột có biểu tượng khóa yêu cầu quyền xem thông tin nhạy cảm (PII)
        </p>
      )}
    </div>
  );
}
