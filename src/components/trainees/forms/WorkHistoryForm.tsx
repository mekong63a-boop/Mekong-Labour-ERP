import { Plus, Minus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface WorkItem {
  id?: string;
  company_name: string;
  position: string;
  company_name_japanese: string;
  start_date: string;
  end_date: string;
}

interface WorkHistoryFormProps {
  items: WorkItem[];
  onChange: (items: WorkItem[]) => void;
}

export function WorkHistoryForm({ items, onChange }: WorkHistoryFormProps) {
  const addItem = () => {
    onChange([
      ...items,
      { company_name: "", position: "", company_name_japanese: "", start_date: "", end_date: "" },
    ]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof WorkItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-primary">
          <Briefcase className="h-5 w-5" />
          Quá trình làm việc
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Thêm
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
          <div className="col-span-3">Công ty</div>
          <div className="col-span-2">Công việc</div>
          <div className="col-span-3">Công ty (tiếng Nhật)</div>
          <div className="col-span-2">Ngày bắt đầu</div>
          <div className="col-span-1">Ngày kết thúc</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        {items.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Chưa có kinh nghiệm làm việc
          </div>
        ) : (
          items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-3">
                <Input
                  placeholder="Tên công ty"
                  value={item.company_name}
                  onChange={(e) => updateItem(index, "company_name", e.target.value)}
                  className="input-empty"
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Công việc"
                  value={item.position}
                  onChange={(e) => updateItem(index, "position", e.target.value)}
                  className="input-empty"
                />
              </div>
              <div className="col-span-3">
                <Input
                  placeholder="Tên công ty tiếng Nhật"
                  value={item.company_name_japanese}
                  onChange={(e) => updateItem(index, "company_name_japanese", e.target.value)}
                  className="input-empty"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="date"
                  value={item.start_date}
                  onChange={(e) => updateItem(index, "start_date", e.target.value)}
                  className="input-empty"
                />
              </div>
              <div className="col-span-1">
                <Input
                  type="date"
                  value={item.end_date}
                  onChange={(e) => updateItem(index, "end_date", e.target.value)}
                  className="input-empty"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
