# STATE MACHINE - TRAINEE WORKFLOW

## Cập nhật: 2026-02-04

### STAGE CHUẨN (9 stages)

| Order | Stage Code | Tên VN | Tên JP | Terminal? |
|-------|------------|--------|--------|-----------|
| 1 | `registered` | Đã đăng ký | 登録済み | ❌ |
| 2 | `enrolled` | Đã nhập học | 入学済み | ❌ |
| 3 | `training` | Đang đào tạo | 訓練中 | ❌ |
| 4 | `interview_passed` | Đã đậu phỏng vấn | 面接合格 | ❌ |
| 5 | `document_processing` | Đang xử lý hồ sơ | 書類処理中 | ❌ |
| 6 | `ready_to_depart` | Sẵn sàng xuất cảnh | 出国準備完了 | ❌ |
| 7 | `departed` | Đã xuất cảnh | 出国済み | ❌ |
| 8 | `post_departure` | Sau xuất cảnh | 出国後 | ❌ |
| 9 | `terminated` | Kết thúc | 終了 | ✅ |

### TRANSITIONS CHO PHÉP

```
registered ──┬── enrolled (Gán lớp học) [yêu cầu: class_id] → auto tạo KTX pending
             └── terminated

enrolled ────┬── training (Bắt đầu đào tạo)
             └── terminated → auto checkout KTX

training ────┬── interview_passed (Đậu phỏng vấn) [yêu cầu: receiving_company_id]
             └── terminated → auto checkout KTX

interview_passed ─┬── document_processing (Làm hồ sơ)
                  ├── training (Quay lại đào tạo)
                  └── terminated → auto checkout KTX

document_processing ─┬── ready_to_depart (Hoàn tất hồ sơ) [yêu cầu: visa_date, coe_date]
                     ├── interview_passed (Hồ sơ lỗi)
                     └── terminated → auto checkout KTX

ready_to_depart ─┬── departed (Xuất cảnh) [yêu cầu: departure_date] → auto checkout KTX
                 ├── document_processing (Hoãn xuất cảnh)
                 └── terminated → auto checkout KTX

departed ────┬── post_departure (Đến Nhật) [yêu cầu: entry_date]
             └── terminated

post_departure ── terminated (Kết thúc hợp đồng)
```

### TERMINATED SUB-STATUS

| Code | Tên VN | Tên JP |
|------|--------|--------|
| `withdrawn` | Tự rút lui | 自主退学 |
| `rejected` | Bị loại | 不合格 |
| `violation` | Vi phạm | 規則違反 |
| `medical` | Lý do sức khỏe | 健康上の理由 |
| `family` | Lý do gia đình | 家庭の事情 |
| `absconded` | Bỏ trốn | 失踪 |
| `early_return` | Về nước sớm | 早期帰国 |
| `contract_completed` | Hoàn thành hợp đồng | 契約満了 |

### SIDE-EFFECTS TỰ ĐỘNG

| Transition | Side Effect |
|------------|-------------|
| `* → enrolled` | Tạo `dormitory_residents` với status='pending' |
| `* → terminated/departed` | Checkout KTX (set check_out_date, status='checked_out') |

### RPC FUNCTIONS

```sql
-- Chuyển trạng thái (UI chỉ gọi hàm này)
rpc_transition_trainee_stage(p_trainee_id, p_to_stage, p_sub_status, p_reason)

-- Lấy các transition khả dụng
rpc_get_allowed_transitions(p_trainee_id)

-- Lấy timeline lịch sử
rpc_get_stage_timeline(p_trainee_id)
```

### NGUYÊN TẮC

1. **UI chỉ là viewer + commander**: Không tự quyết định logic
2. **1 học viên = 1 luồng trạng thái**: trainee_workflow.current_stage là source of truth
3. **Mọi chuyển đổi qua RPC**: Không update trực tiếp database từ frontend
4. **Side-effects tự động**: Database trigger xử lý, không phải frontend
5. **History đầy đủ**: Mọi chuyển đổi được log trong trainee_workflow_history

### DATABASE TABLES

- `master_trainee_stages` - Danh sách stage chuẩn
- `master_stage_transitions` - Các chuyển đổi cho phép + điều kiện
- `master_terminated_reasons` - Lý do kết thúc
- `trainee_workflow` - Trạng thái hiện tại của từng học viên
- `trainee_workflow_history` - Lịch sử chuyển đổi

### INDEXES ĐÃ TẠO

```sql
idx_trainee_workflow_current_stage
idx_trainee_workflow_trainee_id
idx_trainee_workflow_history_trainee_id
idx_trainee_workflow_history_to_stage
idx_trainees_class_id
idx_trainees_receiving_company
idx_dormitory_residents_trainee
idx_dormitory_residents_status
```
