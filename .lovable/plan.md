

## Plan: Tích hợp xuất 履歴書 (Lí lịch Nhật) dạng Excel

### Phân tích file mẫu vs Database hiện tại

| Mục trong 履歴書 | Trường DB hiện có | Ghi chú |
|---|---|---|
| No | `trainee_code` | Co |
| 氏名 フリガナ | `furigana` | Co |
| 英字表記 | `full_name` | Co |
| 生年月日 / 年齢 | `birth_date` | Tính tuổi từ birth_date |
| 性別 | `gender` | Co |
| 出生地 | `birthplace` | Co |
| 婚姻 | `marital_status` | Co |
| 現住所 | `current_address` | Co |
| 学歴 | `education_history` (school_name, start_year/month, end_year/month) | Co |
| 職歴 + 月収 | `work_history` (company_name, position, start_date, end_date, income) | Co |
| 過去の在留許可 | `prior_residence_status` | Co |
| 家族構成 | `family_members` (full_name, relationship, birth_year, occupation, income, location) | Co - thiếu "同居" |
| 在日親戚 | `japan_relatives` (full_name, age, gender, relationship, residence_status, address_japan) | Co |
| 身長/体重 | `height`, `weight` | Co |
| 血液型 | `blood_group` | Co |
| 視力 | `vision_left`, `vision_right` | Co |
| 聴力 | `hearing` | Co |
| 利き手 | `dominant_hand` | Co |
| 刺青 | `tattoo` | Co |
| Ｂ型肝炎 | `hepatitis_b` | Co |
| 健康診断 | `health_status` | Co |
| 資格・免許 | `japanese_certificate` | Co |
| 趣味・特技 | `hobbies` | Co |
| 飲酒/喫煙 | `drinking`, `smoking` | Co |
| **メガネ** | **Chưa có** | Cần thêm |
| **性自認・指向** | **Chưa có** | Cần thêm |
| **性格** | **Chưa có** | Cần thêm |
| **あいさつ・受け答え** | **Chưa có** | Cần thêm |
| **整理・整頓** | **Chưa có** | Cần thêm |
| **規則の順守** | **Chưa có** | Cần thêm |
| **授業態度** | **Chưa có** | Cần thêm |
| **備考** | `notes` (có sẵn) | Dùng notes hoặc thêm riêng |
| **同居 (gia đình)** | **Chưa có** | Cần thêm vào family_members |

### Phương án thực hiện

Theo yêu cầu: các trường chưa có sẽ được **thêm vào DB** nhưng **không hiển thị trên UI**, chỉ xuất hiện khi xuất file Excel. Không thay đổi bất kỳ giao diện hay logic hiện tại.

#### 1. Migration: Thêm các cột mới vào bảng `trainees`

Thêm 7 cột vào bảng `trainees` (ẩn trên UI, chỉ dùng khi xuất):
- `glasses` (text, nullable) — メガネ: 有/無
- `gender_identity` (text, nullable) — 性自認・指向: 有/無/－
- `personality` (text, nullable) — 性格: 活/普/控
- `greeting_attitude` (text, nullable) — あいさつ: 優/良/可
- `tidiness` (text, nullable) — 整理整頓: 優/良/可
- `discipline` (text, nullable) — 規則順守: 優/良/可/未
- `class_attitude` (text, nullable) — 授業態度: 優/良/可/未
- `rirekisho_remarks` (text, nullable) — 備考 riêng cho 履歴書

Thêm 1 cột vào bảng `family_members`:
- `living_together` (boolean, default false) — 同居

#### 2. Cập nhật RPC `get_trainee_full_profile`

Thêm các trường mới vào kết quả trả về để Edge Function có thể đọc.

#### 3. Tạo Edge Function `export-rirekisho`

- Nhận `trainee_code` qua query param
- Gọi RPC `get_trainee_full_profile` để lấy toàn bộ dữ liệu (SSOT)
- Dùng SheetJS (xlsx) tạo file `.xlsx` với layout chính xác theo file mẫu:
  - Cell merging tái tạo bố cục form
  - Borders, font formatting
  - Các ô tô màu = cố định (label), ô trắng = dữ liệu
- Map dữ liệu:
  - Thông tin cá nhân → từ trainee record
  - 学歴 → từ `education_history` (format: `{start_year}年{start_month}月` / `{end_year}年{end_month}月` / `{school_name}高校`)
  - 職歴 → từ `work_history` (format tương tự + `{position}（月収{income}）`)
  - 家族構成 → từ `family_members` (tính tuổi từ birth_year, 同居 = X/O)
  - 在日親戚 → từ `japan_relatives`
  - 生活態度 → từ các cột mới (để trống nếu chưa nhập)
- Trả về binary `.xlsx` với filename `{trainee_code} - 履歴書.xlsx`

#### 4. Thêm nút "Xuất lí lịch" vào `TraineeDetail.tsx`

- Thêm 1 nút bên cạnh nút "Chỉnh sửa" hiện tại
- Click → gọi Edge Function → tải file về
- Không thay đổi bất kỳ logic hay UI nào khác

#### 5. Cập nhật `supabase/config.toml`

Thêm entry cho function mới:
```toml
[functions.export-rirekisho]
verify_jwt = false
```

### Tóm tắt file thay đổi

| File | Hành động |
|---|---|
| Migration SQL | Thêm 8 cột `trainees` + 1 cột `family_members` |
| Migration SQL | Cập nhật RPC `get_trainee_full_profile` thêm các trường mới |
| `supabase/functions/export-rirekisho/index.ts` | **Tạo mới** - Edge Function xuất Excel |
| `supabase/config.toml` | Thêm config cho function mới |
| `src/pages/TraineeDetail.tsx` | Thêm nút "Xuất lí lịch" (chỉ thêm, không sửa code cũ) |

