import { useState } from "react";
import { Plus, Minus, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EDUCATION_LEVELS = ["THCS", "THPT", "TTGDTX", "TRUNG CẤP", "CAO ĐẲNG", "ĐẠI HỌC"];

export interface EducationItem {
  id?: string;
  school_name: string;
  level: string;
  major: string;
  start_year: string;
  end_year: string;
}

interface EducationHistoryFormProps {
  items: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}

export function EducationHistoryForm({ items, onChange }: EducationHistoryFormProps) {
  const addItem = () => {
    onChange([
      ...items,
      { school_name: "", level: "", major: "", start_year: "", end_year: "" },
    ]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof EducationItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-primary">
          <GraduationCap className="h-5 w-5" />
          Quá trình Học tập
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
          <div className="col-span-4">Trường</div>
          <div className="col-span-2">Cấp Độ</div>
          <div className="col-span-3">Chuyên Môn</div>
          <div className="col-span-1">Năm vào</div>
          <div className="col-span-1">Năm TN</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        {items.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Chưa có thông tin học tập
          </div>
        ) : (
          items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <Input
                  placeholder="Tên trường"
                  value={item.school_name}
                  onChange={(e) => updateItem(index, "school_name", e.target.value)}
                  className="input-empty"
                />
              </div>
              <div className="col-span-2">
                <Select
                  value={item.level}
                  onValueChange={(v) => updateItem(index, "level", v)}
                >
                  <SelectTrigger className="input-empty">
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Input
                  placeholder="Chuyên ngành"
                  value={item.major}
                  onChange={(e) => updateItem(index, "major", e.target.value)}
                  className="input-empty"
                />
              </div>
              <div className="col-span-1">
                <Input
                  placeholder="2018"
                  value={item.start_year}
                  onChange={(e) => updateItem(index, "start_year", e.target.value)}
                  className="input-empty"
                />
              </div>
              <div className="col-span-1">
                <Input
                  placeholder="2021"
                  value={item.end_year}
                  onChange={(e) => updateItem(index, "end_year", e.target.value)}
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
