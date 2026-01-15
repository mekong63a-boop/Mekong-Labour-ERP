-- Tạo job category nếu chưa có
INSERT INTO job_categories (code, name, name_japanese, category)
VALUES ('JC001', 'Lắp ráp linh kiện điện tử', '電子部品組立', 'Điện tử')
ON CONFLICT (code) DO NOTHING;

-- Tạo 12 học viên test với các giai đoạn khác nhau
INSERT INTO trainees (trainee_code, full_name, furigana, gender, birth_date, birthplace, phone, email, 
  cccd_number, cccd_date, cccd_place, passport_number, passport_date, progression_stage, simple_status,
  enrollment_status, registration_date, receiving_company_id, union_id, class_id, trainee_type,
  interview_pass_date, document_submission_date, otit_entry_date, nyukan_entry_date, coe_date, visa_date,
  departure_date, contract_term, absconded_date, early_return_date, early_return_reason, return_date,
  height, weight, blood_group, education_level, marital_status, permanent_address)
VALUES 
-- 1. Chưa đậu
('HV2501001', 'Nguyễn Văn An', 'グエン ヴァン アン', 'Nam', '1998-05-15', 'Hà Nội', '0901234567', 'nguyenvanan@gmail.com',
  '001198012345', '2020-01-15', 'Hà Nội', NULL, NULL, 'Chưa đậu', 'Đăng ký mới', 'Chưa nhập học', '2025-01-10',
  NULL, NULL, NULL, 'Thực tập sinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL,
  170, 65, 'A', '12/12', 'Độc thân', 'Số 10, Hoàng Mai, Hà Nội'),

-- 2. Đậu phỏng vấn  
('HV2501002', 'Trần Thị Bình', 'チャン ティ ビン', 'Nữ', '1999-08-22', 'Bắc Ninh', '0912345678', 'tranthiminh@gmail.com',
  '027199012346', '2020-03-20', 'Bắc Ninh', 'C1234567', '2024-06-15', 'Đậu phỏng vấn', 'Đang học', 'Đang học', '2024-11-05',
  'fa8cf3f1-5649-45a0-9b3e-19d32d253130', '8b6185d0-8a57-48ae-9ff6-9f6357cc3d67', '0ac32383-fa09-4b1b-94ca-f45c984ff360', 'Thực tập sinh', 
  '2025-01-08', NULL, NULL, NULL, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL,
  158, 48, 'B', '12/12', 'Độc thân', 'Thành phố Bắc Ninh, Bắc Ninh'),

-- 3. Nộp hồ sơ
('HV2501003', 'Lê Văn Cường', 'レ ヴァン クオン', 'Nam', '1997-03-10', 'Nghệ An', '0923456789', 'levancuong@gmail.com',
  '038197012347', '2019-12-10', 'Nghệ An', 'C2345678', '2024-05-20', 'Nộp hồ sơ', 'Đang học', 'Đang học', '2024-09-15',
  'fa8cf3f1-5649-45a0-9b3e-19d32d253130', '8b6185d0-8a57-48ae-9ff6-9f6357cc3d67', '0ac32383-fa09-4b1b-94ca-f45c984ff360', 'Thực tập sinh',
  '2024-12-01', '2025-01-05', NULL, NULL, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL,
  172, 68, 'O', '12/12', 'Độc thân', 'Vinh, Nghệ An'),

-- 4. OTIT
('HV2501004', 'Phạm Thị Dung', 'ファム ティ ズン', 'Nữ', '2000-11-25', 'Thái Bình', '0934567890', 'phamthidung@gmail.com',
  '034200012348', '2021-05-15', 'Thái Bình', 'C3456789', '2024-04-10', 'OTIT', 'Đang học', 'Đang học', '2024-08-01',
  'fa8cf3f1-5649-45a0-9b3e-19d32d253130', '8b6185d0-8a57-48ae-9ff6-9f6357cc3d67', '0ac32383-fa09-4b1b-94ca-f45c984ff360', 'Thực tập sinh',
  '2024-10-15', '2024-11-20', '2025-01-02', NULL, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL,
  155, 45, 'AB', 'Đại học', 'Độc thân', 'Thái Bình'),

-- 5. Nyukan
('HV2501005', 'Hoàng Văn Em', 'ホアン ヴァン エム', 'Nam', '1996-07-08', 'Hà Tĩnh', '0945678901', 'hoangvanem@gmail.com',
  '042196012349', '2018-10-20', 'Hà Tĩnh', 'C4567890', '2024-03-05', 'Nyukan', 'Đang học', 'Đang học', '2024-06-10',
  'fa8cf3f1-5649-45a0-9b3e-19d32d253130', '8b6185d0-8a57-48ae-9ff6-9f6357cc3d67', '0ac32383-fa09-4b1b-94ca-f45c984ff360', 'Thực tập sinh',
  '2024-08-20', '2024-09-25', '2024-11-01', '2024-12-15', NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL,
  175, 70, 'A', 'Cao đẳng', 'Đã kết hôn', 'Kỳ Anh, Hà Tĩnh'),

-- 6. COE
('HV2501006', 'Vũ Thị Phượng', 'ヴ ティ フオン', 'Nữ', '1998-01-30', 'Nam Định', '0956789012', 'vuthiphuong@gmail.com',
  '036198012350', '2020-06-25', 'Nam Định', 'C5678901', '2024-02-15', 'COE', 'Đang học', 'Đang học', '2024-05-01',
  'fa8cf3f1-5649-45a0-9b3e-19d32d253130', '8b6185d0-8a57-48ae-9ff6-9f6357cc3d67', '0ac32383-fa09-4b1b-94ca-f45c984ff360', 'Thực tập sinh',
  '2024-07-10', '2024-08-15', '2024-10-01', '2024-11-15', '2025-01-05', NULL, NULL, 3, NULL, NULL, NULL, NULL,
  160, 50, 'B', '12/12', 'Độc thân', 'Nam Định'),

-- 7. Visa
('HV2501007', 'Đỗ Văn Giang', 'ド ヴァン ザン', 'Nam', '1999-09-12', 'Thanh Hóa', '0967890123', 'dovangiang@gmail.com',
  '038199012351', '2021-03-10', 'Thanh Hóa', 'C6789012', '2024-01-20', 'Visa', 'Đang học', 'Đang học', '2024-04-15',
  'fa8cf3f1-5649-45a0-9b3e-19d32d253130', '8b6185d0-8a57-48ae-9ff6-9f6357cc3d67', '0ac32383-fa09-4b1b-94ca-f45c984ff360', 'Thực tập sinh',
  '2024-06-01', '2024-07-10', '2024-09-01', '2024-10-15', '2024-12-01', '2025-01-10', NULL, 3, NULL, NULL, NULL, NULL,
  168, 62, 'O', 'Trung cấp', 'Độc thân', 'Thanh Hóa'),

-- 8. Xuất cảnh
('HV2501008', 'Ngô Thị Hương', 'ゴ ティ フオン', 'Nữ', '1997-04-18', 'Hải Dương', '0978901234', 'ngothihuong@gmail.com',
  '030197012352', '2019-08-05', 'Hải Dương', 'C7890123', '2023-10-10', 'Xuất cảnh', 'Đang ở Nhật', 'Đã tốt nghiệp', '2024-01-10',
  'fa8cf3f1-5649-45a0-9b3e-19d32d253130', '8b6185d0-8a57-48ae-9ff6-9f6357cc3d67', NULL, 'Thực tập sinh',
  '2024-03-15', '2024-04-20', '2024-06-01', '2024-07-15', '2024-09-01', '2024-10-15', '2025-01-05', 3, NULL, NULL, NULL, NULL,
  157, 47, 'A', '12/12', 'Độc thân', 'Hải Dương'),

-- 9. Đang làm việc
('HV2501009', 'Bùi Văn Kiên', 'ブイ ヴァン キエン', 'Nam', '1995-12-05', 'Phú Thọ', '0989012345', 'buivankien@gmail.com',
  '025195012353', '2017-05-20', 'Phú Thọ', 'C8901234', '2022-08-15', 'Đang làm việc', 'Đang ở Nhật', 'Đã tốt nghiệp', '2023-02-01',
  'fa8cf3f1-5649-45a0-9b3e-19d32d253130', '8b6185d0-8a57-48ae-9ff6-9f6357cc3d67', NULL, 'Thực tập sinh',
  '2023-04-10', '2023-05-15', '2023-07-01', '2023-08-15', '2023-10-01', '2023-11-15', '2024-01-10', 3, NULL, NULL, NULL, NULL,
  178, 75, 'B', 'Cao đẳng', 'Đã kết hôn', 'Việt Trì, Phú Thọ'),

-- 10. Hoàn thành hợp đồng
('HV2501010', 'Đinh Thị Lan', 'ディン ティ ラン', 'Nữ', '1994-06-20', 'Ninh Bình', '0990123456', 'dinhthilan@gmail.com',
  '037194012354', '2016-09-10', 'Ninh Bình', 'C9012345', '2020-03-05', 'Hoàn thành hợp đồng', 'Rời công ty', 'Đã tốt nghiệp', '2020-08-01',
  'fa8cf3f1-5649-45a0-9b3e-19d32d253130', '8b6185d0-8a57-48ae-9ff6-9f6357cc3d67', NULL, 'Thực tập sinh',
  '2020-10-15', '2020-11-20', '2021-01-05', '2021-02-15', '2021-04-01', '2021-05-15', '2021-07-10', 3, NULL, NULL, NULL, '2024-07-10',
  162, 52, 'O', '12/12', 'Đã kết hôn', 'Ninh Bình'),

-- 11. Bỏ trốn
('HV2501011', 'Lý Văn Minh', 'リ ヴァン ミン', 'Nam', '1996-02-14', 'Hưng Yên', '0901234568', 'lyvanminh@gmail.com',
  '033196012355', '2018-04-25', 'Hưng Yên', 'C0123456', '2021-05-10', 'Bỏ trốn', 'Rời công ty', 'Đã tốt nghiệp', '2021-09-15',
  'fa8cf3f1-5649-45a0-9b3e-19d32d253130', '8b6185d0-8a57-48ae-9ff6-9f6357cc3d67', NULL, 'Thực tập sinh',
  '2021-11-20', '2021-12-25', '2022-02-10', '2022-03-25', '2022-05-10', '2022-06-25', '2022-08-15', 3, '2023-06-20', NULL, NULL, NULL,
  173, 67, 'AB', 'Trung cấp', 'Độc thân', 'Hưng Yên'),

-- 12. Về trước hạn
('HV2501012', 'Mai Thị Ngọc', 'マイ ティ ゴック', 'Nữ', '1998-10-08', 'Vĩnh Phúc', '0912345679', 'maithingoc@gmail.com',
  '026198012356', '2020-07-30', 'Vĩnh Phúc', 'C1234568', '2022-01-20', 'Về trước hạn', 'Rời công ty', 'Đã tốt nghiệp', '2022-05-10',
  'fa8cf3f1-5649-45a0-9b3e-19d32d253130', '8b6185d0-8a57-48ae-9ff6-9f6357cc3d67', NULL, 'Thực tập sinh',
  '2022-07-15', '2022-08-20', '2022-10-05', '2022-11-20', '2023-01-05', '2023-02-20', '2023-04-10', 3, NULL, '2024-02-15', 'Lý do gia đình - bố mẹ ốm', NULL,
  156, 46, 'A', '12/12', 'Độc thân', 'Vĩnh Phúc');