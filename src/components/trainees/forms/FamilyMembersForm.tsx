import { Plus, Minus, Users } from "lucide-react";
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

const RELATIONSHIPS = [
  "Cha", "Mẹ", "Anh trai", "Chị gái", "Em trai", "Em gái", 
  "Con trai", "Con gái", "Vợ", "Chồng", "Ông nội", "Bà nội", 
  "Ông ngoại", "Bà ngoại", "Cô", "Dì", "Chú", "Bác", "Khác"
];
const GENDERS = ["Nam", "Nữ"];
const LIVING_STATUS = ["Sống chung", "Sống riêng"];

export interface FamilyItem {
  id?: string;
  relationship: string;
  gender: string;
  full_name: string;
  birth_year: string;
  living_status: string;
  occupation: string;
  income: string;
}

interface FamilyMembersFormProps {
  items: FamilyItem[];
  onChange: (items: FamilyItem[]) => void;
}

export function FamilyMembersForm({ items, onChange }: FamilyMembersFormProps) {
  const addItem = () => {
    onChange([
      ...items,
      { relationship: "", gender: "", full_name: "", birth_year: "", living_status: "", occupation: "", income: "" },
    ]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FamilyItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const validateBirthYear = (year: string): boolean => {
    if (!year) return true;
    const y = parseInt(year);
    const currentYear = new Date().getFullYear();
    return y >= 1900 && y <= currentYear;
  };

  const getInputClass = (value: string, isValid: boolean = true) => {
    if (!isValid) return "border-destructive bg-destructive/10";
    return value ? "" : "input-empty";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-primary">
          <Users className="h-5 w-5" />
          Mối quan hệ gia đình
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Thêm thành viên
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
          <div className="col-span-2">Quan hệ</div>
          <div className="col-span-1">Giới tính</div>
          <div className="col-span-2">Họ và tên</div>
          <div className="col-span-1">Năm sinh</div>
          <div className="col-span-2">Sống chung/riêng</div>
          <div className="col-span-2">Công việc</div>
          <div className="col-span-1">Thu nhập</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        {items.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Chưa có thông tin gia đình
          </div>
        ) : (
          items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-2">
                <Select
                  value={item.relationship}
                  onValueChange={(v) => updateItem(index, "relationship", v)}
                >
                  <SelectTrigger className={item.relationship ? "" : "input-empty"}>
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Select
                  value={item.gender}
                  onValueChange={(v) => updateItem(index, "gender", v)}
                >
                  <SelectTrigger className={item.gender ? "" : "input-empty"}>
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Họ và tên"
                  value={item.full_name}
                  onChange={(e) => updateItem(index, "full_name", e.target.value)}
                  className={getInputClass(item.full_name)}
                />
              </div>
              <div className="col-span-1">
                <Input
                  placeholder="1970"
                  value={item.birth_year}
                  onChange={(e) => updateItem(index, "birth_year", e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className={getInputClass(item.birth_year, validateBirthYear(item.birth_year))}
                />
              </div>
              <div className="col-span-2">
                <Select
                  value={item.living_status}
                  onValueChange={(v) => updateItem(index, "living_status", v)}
                >
                  <SelectTrigger className={item.living_status ? "" : "input-empty"}>
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIVING_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Nghề nghiệp"
                  value={item.occupation}
                  onChange={(e) => updateItem(index, "occupation", e.target.value)}
                  className={getInputClass(item.occupation)}
                />
              </div>
              <div className="col-span-1">
                <Input
                  placeholder="10tr"
                  value={item.income}
                  onChange={(e) => updateItem(index, "income", e.target.value)}
                  className={getInputClass(item.income)}
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