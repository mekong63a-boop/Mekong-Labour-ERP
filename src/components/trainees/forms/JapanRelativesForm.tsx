import { Plus, Minus, MapPin } from "lucide-react";
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
  "Con trai", "Con gái", "Vợ", "Chồng", "Ông", "Bà", 
  "Cô", "Dì", "Chú", "Bác", "Bạn bè", "Khác"
];
const GENDERS = ["Nam", "Nữ"];
const RESIDENCE_STATUS = [
  "Thực tập sinh",
  "Kỹ năng đặc định",
  "Kỹ sư",
  "Du học sinh", 
  "Vĩnh trú",
  "Định cư",
  "Phối ngẫu người Nhật",
  "Khác"
];

export interface JapanRelativeItem {
  id?: string;
  full_name: string;
  relationship: string;
  age: string;
  gender: string;
  address_japan: string;
  residence_status: string;
}

interface JapanRelativesFormProps {
  items: JapanRelativeItem[];
  onChange: (items: JapanRelativeItem[]) => void;
}

export function JapanRelativesForm({ items, onChange }: JapanRelativesFormProps) {
  const addItem = () => {
    onChange([
      ...items,
      { full_name: "", relationship: "", age: "", gender: "", address_japan: "", residence_status: "" },
    ]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof JapanRelativeItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const validateAge = (age: string): boolean => {
    if (!age) return true;
    const a = parseInt(age);
    return a >= 0 && a <= 120;
  };

  const getInputClass = (value: string, isValid: boolean = true) => {
    if (!isValid) return "border-destructive bg-destructive/10";
    return value ? "" : "input-empty";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-primary">
          <MapPin className="h-5 w-5" />
          <span className="text-xs text-muted-foreground mr-1">JP</span>
          Họ hàng / Người quen tại Nhật Bản
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Thêm người thân
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
          <div className="col-span-3">Họ tên</div>
          <div className="col-span-2">Quan hệ</div>
          <div className="col-span-1">Tuổi</div>
          <div className="col-span-1">Giới tính</div>
          <div className="col-span-3">Địa chỉ tại Nhật</div>
          <div className="col-span-1">Tư cách lưu trú</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        {items.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Chưa có thông tin người thân tại Nhật
          </div>
        ) : (
          items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-3">
                <Input
                  placeholder="Họ và tên"
                  value={item.full_name}
                  onChange={(e) => updateItem(index, "full_name", e.target.value)}
                  className={getInputClass(item.full_name)}
                />
              </div>
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
                <Input
                  placeholder="30"
                  value={item.age}
                  onChange={(e) => updateItem(index, "age", e.target.value.replace(/\D/g, '').slice(0, 3))}
                  className={getInputClass(item.age, validateAge(item.age))}
                />
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
              <div className="col-span-3">
                <Input
                  placeholder="Địa chỉ tại Nhật"
                  value={item.address_japan}
                  onChange={(e) => updateItem(index, "address_japan", e.target.value)}
                  className={getInputClass(item.address_japan)}
                />
              </div>
              <div className="col-span-1">
                <Select
                  value={item.residence_status}
                  onValueChange={(v) => updateItem(index, "residence_status", v)}
                >
                  <SelectTrigger className={item.residence_status ? "" : "input-empty"}>
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESIDENCE_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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