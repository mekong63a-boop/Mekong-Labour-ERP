

## Root Cause Analysis

The issue is **NOT** in the React frontend code at all. It's a **database trigger chain** that overwrites the `simple_status` after every INSERT:

1. User saves new trainee with `simple_status = 'Dừng chương trình'`
2. The INSERT succeeds with the correct value
3. **Trigger `trigger_auto_create_workflow`** fires AFTER INSERT → creates a `trainee_workflow` record with `current_stage = 'recruited'`
4. **Trigger `trigger_sync_trainee_status`** fires on the workflow insert → maps `'recruited'` → `'Đang học'` and **overwrites** `trainees.simple_status` back to `'Đang học'`

This is why the status always resets — the workflow sync trigger blindly overwrites whatever `simple_status` value the user set.

The same issue affects editing: the previous `formDataRef` fixes were unnecessary — the real problem was always this trigger chain.

## Fix Plan

**Modify the `auto_create_trainee_workflow` function** to respect the `simple_status` value set by the user during INSERT:

1. **Map the trainee's `simple_status` to the correct workflow stage** instead of always using `'recruited'`. For example:
   - `'Đăng ký mới'` → `'registered'` (or keep `'recruited'`)
   - `'Dừng chương trình'` → `'terminated'`
   - `'Đang học'` → `'training'`

2. **Alternatively (simpler and safer)**: Modify the `sync_trainee_status_from_workflow` trigger to **skip the update** when it's triggered by the initial auto-create. This prevents the overwrite.

**Recommended approach**: Update `auto_create_trainee_workflow` to map from the NEW trainee's `simple_status` to the correct workflow stage, so the sync trigger maps it back to the same value. This keeps the system consistent.

### Files to modify:
- **New SQL migration**: Recreate `auto_create_trainee_workflow()` to use `NEW.simple_status` to determine the correct `current_stage` instead of hardcoding `'recruited'`

### Migration SQL (core logic):
```sql
CREATE OR REPLACE FUNCTION public.auto_create_trainee_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stage trainee_workflow_stage;
BEGIN
  -- Map simple_status to workflow stage (reverse mapping)
  v_stage := CASE NEW.simple_status
    WHEN 'Đăng ký mới' THEN 'registered'::trainee_workflow_stage
    WHEN 'Đang học' THEN 'training'::trainee_workflow_stage
    WHEN 'Dừng chương trình' THEN 'terminated'::trainee_workflow_stage
    WHEN 'Hủy' THEN 'terminated'::trainee_workflow_stage
    WHEN 'Không học' THEN 'terminated'::trainee_workflow_stage
    WHEN 'Bảo lưu' THEN 'recruited'::trainee_workflow_stage
    WHEN 'Đang ở Nhật' THEN 'departed'::trainee_workflow_stage
    WHEN 'Rời công ty' THEN 'terminated'::trainee_workflow_stage
    ELSE 'registered'::trainee_workflow_stage
  END;

  INSERT INTO trainee_workflow (trainee_id, current_stage, created_at, updated_at)
  VALUES (NEW.id, v_stage, NOW(), NOW())
  ON CONFLICT (trainee_id) DO NOTHING;
  RETURN NEW;
END;
$$;
```

Additionally, update `sync_trainee_status_from_workflow` to handle `'registered'` → `'Đăng ký mới'` (currently maps to `'Đang học'`, which is wrong) and add the `'terminated'` stage mapping.

Also **clean up the unnecessary `formDataRef` workarounds** in TraineeForm.tsx since they were masking the real DB issue, though they are harmless to keep.

