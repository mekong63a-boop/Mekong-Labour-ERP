

## Cap nhat PDF xuat day du nhu trang Tra cuu ho so

### Hien trang
Trang **Tra cuu ho so** (TraineeProfileView) hien thi **22 section** day du, nhung file PDF chi xuat **8 section**. Cac phan con thieu trong PDF:

| Section thieu trong PDF | Du lieu |
|---|---|
| The chat & Suc khoe | height, weight, blood_group, vision, hearing, hepatitis_b, smoking, drinking, tattoo, hobbies, health_status, dominant_hand |
| Dia chi | temp_address, household_address |
| Giay to | cccd_place |
| Thong tin ca nhan | ethnicity, religion, marital_status, education_level, policy_category |
| Hoc van | education_history (truong, cap, nganh, nam) |
| Kinh nghiem lam viec | work_history (cong ty, vi tri, thoi gian) |
| Thanh vien gia dinh | family_members (table) |
| Than nhan tai Nhat | japan_relatives (table) |
| Lich su o KTX | dormitory_history (table) |
| Lich su chuyen lop | enrollment_history |
| Ghi chu nghiep vu | trainee_notes |
| Vi pham | violations |
| Lich su giai doan | workflow_history |
| Nhat ky he thong | audit_logs |
| Moc thoi gian | registration_date, interview_count, visa_date, expected_entry_month |

### Giai phap

Cap nhat file `supabase/functions/export-trainee-pdf/index.ts`:

1. **Mo rong TraineeProfile interface** trong edge function de bao gom tat ca cac truong con thieu (education_history, work_history, family_members, japan_relatives, dormitory_history, enrollment_history, workflow_history, audit_logs, trainee_notes, violations, + cac truong don le)

2. **Them cac section vao PDF theo dung thu tu nhu UI:**
   - **THONG TIN CA NHAN**: them ethnicity, religion, marital_status, education_level, policy_category
   - **DIA CHI**: them temp_address, household_address
   - **GIAY TO**: them cccd_place
   - **THE CHAT & SUC KHOE** (section moi): height, weight, blood_group, vision, hearing, hepatitis_b, dominant_hand, smoking, drinking, tattoo, health_status, hobbies
   - **MOC THOI GIAN**: them registration_date, interview_count, visa_date, expected_entry_month
   - **HOC VAN** (section moi): bang voi truong, cap, nganh, nam
   - **KINH NGHIEM LAM VIEC** (section moi): bang voi cong ty, vi tri, thoi gian
   - **THANH VIEN GIA DINH** (section moi): bang voi ho ten, quan he, nam sinh, nghe, noi o
   - **THAN NHAN TAI NHAT** (section moi): bang voi ho ten, quan he, tuoi, dia chi, tu cach luu tru
   - **LICH SU O KTX** (section moi): bang voi KTX, phong, giuong, ngay vao/ra
   - **LICH SU CHUYEN LOP** (section moi): danh sach hanh dong + ngay
   - **GHI CHU NGHIEP VU** (section moi): danh sach ghi chu theo loai
   - **VI PHAM** (section moi): danh sach vi pham theo loai + ngay
   - **LICH SU GIAI DOAN** (section moi): danh sach chuyen doi from → to + ngay
   - **NHAT KY HE THONG** (section moi): bang voi thoi gian, hanh dong, mo ta (gioi han 50 dong)

3. **Helper moi `drawTable`**: tao ham ve bang trong PDF (header row + data rows) de tai su dung cho family_members, japan_relatives, dormitory_history, audit_logs

### File thay doi

| File | Noi dung |
|------|---------|
| `supabase/functions/export-trainee-pdf/index.ts` | Mo rong interface, them tat ca section con thieu, them ham drawTable |

