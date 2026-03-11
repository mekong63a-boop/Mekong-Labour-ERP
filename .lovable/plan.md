

# Kế hoạch Dọn dẹp Hệ thống (System Cleanup)

## Tổng quan

Loại bỏ toàn bộ hệ thống workflow "bóng" không sử dụng, giữ `trainees.progression_stage` là SSOT duy nhất.

## Phạm vi xóa

### 1. Database Migration (1 migration SQL)

**Xóa 3 triggers trên bảng `trainees`/`trainee_workflow`:**
- `trigger_auto_create_workflow` (on trainees INSERT)
- `trigger_sync_trainee_status` (on trainee_workflow UPDATE)
- `trigger_workflow_transition` (on trainee_workflow UPDATE)
- `update_trainee_workflow_updated_at` (on trainee_workflow UPDATE)

**Xóa 2 views:**
- `trainees_with_workflow`
- `dashboard_trainee_by_stage`

**Xóa 5 bảng (theo thứ tự dependency):**
1. `trainee_workflow_history` (FK → trainee_workflow)
2. `trainee_workflow` (FK → trainees)
3. `master_stage_transitions` (FK → master_trainee_stages)
4. `master_terminated_reasons`
5. `master_trainee_stages`

**Xóa 10 functions:**
1. `auto_create_trainee_workflow()`
2. `sync_trainee_status_from_workflow()`
3. `log_workflow_transition()`
4. `transition_trainee_stage()`
5. `get_trainee_workflow()`
6. `map_progression_to_workflow_stage()`
7. `workflow_stage_label()`
8. `rpc_transition_trainee_stage()`
9. `rpc_get_stage_timeline()`
10. `rpc_get_allowed_transitions()`

**Cập nhật 2 functions đang tham chiếu workflow:**
- `get_trainee_full_profile()` — xóa phần query `trainee_workflow` và `trainee_workflow_history`, xóa trường `workflow`/`workflow_history` khỏi output
- `export_trainees_report()` — xóa JOIN `trainee_workflow`, xóa cột `current_stage`/`sub_status`

### 2. Edge Function
- Xóa `supabase/functions/google-drive-upload/index.ts`
- Xóa config trong `supabase/config.toml`

### 3. Frontend (xóa 3 file)
- `src/components/trainees/StageTransitionPanel.tsx`
- `src/components/trainees/StageTimeline.tsx` (cũng import từ useStageTransition)
- `src/hooks/useStageTransition.ts`
- `src/hooks/useGoogleDriveUpload.ts`

### 4. Frontend (sửa 2 file)
- `src/pages/TraineeDetail.tsx` — xóa import `useStageTimeline`, xóa `stageData`, xóa badge hiển thị `currentStage` (thay bằng hiển thị `trainee.progression_stage` trực tiếp)
- `src/hooks/useDashboardTrainee.ts` — xóa hook `useTraineeByStage` (không ai dùng)

### 5. Không thay đổi
- Bảng `trainees` và cột `progression_stage` — giữ nguyên, vẫn là SSOT
- View `trainee_stage_counts` — giữ nguyên (đọc từ `trainees.progression_stage`)
- Tất cả 31 file frontend đang đọc `progression_stage` — không đổi
- Trigger `audit_trainees_changes` và `trigger_calculate_return_date` — giữ nguyên

## Thứ tự thực hiện

1. Tạo migration SQL xóa triggers → views → tables → functions, cập nhật 2 functions
2. Xóa file frontend + edge function
3. Sửa `TraineeDetail.tsx` dùng `progression_stage` trực tiếp
4. Xóa config `google-drive-upload` trong `config.toml`

