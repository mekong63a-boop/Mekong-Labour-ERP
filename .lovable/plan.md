

## Tổng quan
Thêm 2 trường mới vào hồ sơ học viên với khả năng chọn nhiều mục (Multi-select):
1. **Chứng chỉ tiếng Nhật** (JLPT N4, JLPT N3, NAT-Test 4Q, JFT-Basic A2)
2. **Chứng chỉ đặc định** (14 loại chứng chỉ kỹ năng đặc định tiếng Nhật)

Cả 2 trường hoạt động giống như trường **Sở thích** hiện tại - cho phép chọn nhiều mục.

---

## Thiết kế kỹ thuật

### 1. Database Migration
Thêm 2 cột mới vào bảng `trainees`:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `japanese_certificate` | `text` | Lưu dạng comma-separated (VD: "JLPT N4, JLPT N3") |
| `ssw_certificate` | `text` | Lưu dạng comma-separated cho chứng chỉ đặc định |

**SQL Migration:**
```sql
ALTER TABLE trainees 
  ADD COLUMN japanese_certificate text,
  ADD COLUMN ssw_certificate text;

COMMENT ON COLUMN trainees.japanese_certificate IS 'Chứng chỉ tiếng Nhật (JLPT, NAT-Test, JFT)';
COMMENT ON COLUMN trainees.ssw_certificate IS 'Chứng chỉ đặc định (Specified Skilled Worker certificates)';
```

### 2. Danh sách các option

**Chứng chỉ tiếng Nhật:**
- JLPT N4
- JLPT N3
- NAT-Test 4Q
- JFT-Basic A2

**Chứng chỉ đặc định (SSW):**
- 介護技能特定技能1号
- 介護日本語特定技能1号
- 外食業特定技能1号
- 飲食料品製造業特定技能1号
- 農業技能測定試験1号 (耕種農業)
- 農業技能測定試験1号 (畜産農業)
- 自動車整備分野特定技能1号
- 宿泊分野特定技能1号
- 自動車運送業分野特定技能１号（トラック）
- 自動車運送業分野特定技能１号（タクシー）
- 自動車運送業分野特定技能１号（バス）
- 建設分野特定技能1号評価試験（土木）
- 建設分野特定技能1号評価試験（建築）
- 建設分野特定技能1号評価試験（ライフライン・設備）

### 3. Cập nhật TraineeForm.tsx

**a) Thêm constant arrays cho options:**
```typescript
const JAPANESE_CERTIFICATES = [
  "JLPT N4", 
  "JLPT N3", 
  "NAT-Test 4Q", 
  "JFT-Basic A2"
];

const SSW_CERTIFICATES = [
  "介護技能特定技能1号",
  "介護日本語特定技能1号",
  "外食業特定技能1号",
  "飲食料品製造業特定技能1号",
  "農業技能測定試験1号 (耕種農業)",
  "農業技能測定試験1号 (畜産農業)",
  "自動車整備分野特定技能1号",
  "宿泊分野特定技能1号",
  "自動車運送業分野特定技能１号（トラック）",
  "自動車運送業分野特定技能１号（タクシー）",
  "自動車運送業分野特定技能１号（バス）",
  "建設分野特定技能1号評価試験（土木）",
  "建設分野特定技能1号評価試験（建築）",
  "建設分野特定技能1号評価試験（ライフライン・設備）"
];
```

**b) Cập nhật FormData interface (line ~75):**
```typescript
interface FormData {
  // ... existing fields
  japanese_certificate: string[];  // Multi-select
  ssw_certificate: string[];       // Multi-select
}
```

**c) Cập nhật initialFormData (line ~293):**
```typescript
japanese_certificate: [],
ssw_certificate: [],
```

**d) Cập nhật load trainee data (line ~378):**
```typescript
japanese_certificate: trainee.japanese_certificate 
  ? trainee.japanese_certificate.split(", ").filter(Boolean) 
  : [],
ssw_certificate: trainee.ssw_certificate 
  ? trainee.ssw_certificate.split(", ").filter(Boolean) 
  : [],
```

**e) Cập nhật buildTraineeData (line ~579):**
```typescript
const japaneseCertString = Array.isArray(formData.japanese_certificate) 
  ? formData.japanese_certificate.join(", ") 
  : formData.japanese_certificate;

const sswCertString = Array.isArray(formData.ssw_certificate) 
  ? formData.ssw_certificate.join(", ") 
  : formData.ssw_certificate;

return {
  // ... existing fields
  japanese_certificate: japaneseCertString || null,
  ssw_certificate: sswCertString || null,
};
```

**f) Thêm UI components (sau phần Sở thích, line ~1524):**
```tsx
{/* Chứng chỉ */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Chứng chỉ tiếng Nhật</CardTitle>
    </CardHeader>
    <CardContent>
      <MultiSelect
        options={JAPANESE_CERTIFICATES}
        value={formData.japanese_certificate}
        onValueChange={(selected) => updateField("japanese_certificate", selected)}
        placeholder="Chọn chứng chỉ..."
      />
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Chứng chỉ đặc định</CardTitle>
    </CardHeader>
    <CardContent>
      <MultiSelect
        options={SSW_CERTIFICATES}
        value={formData.ssw_certificate}
        onValueChange={(selected) => updateField("ssw_certificate", selected)}
        placeholder="Chọn chứng chỉ..."
      />
    </CardContent>
  </Card>
</div>
```

### 4. Cập nhật PersonalInfoTab.tsx (hiển thị read-only)

Thêm phần hiển thị chứng chỉ trong tab "Thông tin khác":
```tsx
<div>
  <Label className="text-muted-foreground text-xs">Chứng chỉ tiếng Nhật</Label>
  <p>{(trainee as any).japanese_certificate || "—"}</p>
</div>
<div>
  <Label className="text-muted-foreground text-xs">Chứng chỉ đặc định</Label>
  <p>{(trainee as any).ssw_certificate || "—"}</p>
</div>
```

---

## Luồng xử lý dữ liệu

```text
Form (Multi-select array) → join(", ") → DB (text column)
                           ↓
DB (text column) → split(", ") → Form (Multi-select array)
```

---

## Files cần chỉnh sửa

| File | Thay đổi |
|------|---------|
| **Migration SQL** | Thêm 2 cột mới vào bảng trainees |
| `src/pages/TraineeForm.tsx` | Thêm constants, FormData fields, load/save logic, UI components |
| `src/components/trainees/tabs/PersonalInfoTab.tsx` | Hiển thị chứng chỉ trong tab read-only |

---

## Tiêu chí nghiệm thu

1. Mở form học viên → tab Thông tin cá nhân
2. Thấy 2 card mới: "Chứng chỉ tiếng Nhật" và "Chứng chỉ đặc định"
3. Click vào dropdown → hiển thị danh sách options
4. Chọn nhiều mục → các mục được hiển thị dạng badge
5. Bấm X trên badge → xóa mục đó
6. Bấm Lưu → reload trang → dữ liệu vẫn còn
7. Vào trang xem chi tiết (TraineeDetail) → thấy chứng chỉ hiển thị đúng

