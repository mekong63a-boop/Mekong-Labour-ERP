-- Fix duplicate: Update older record to "Đã chuyển"
UPDATE public.dormitory_residents 
SET status = 'Đã chuyển', 
    check_out_date = '2026-01-21',
    transfer_reason = 'Chuyển sang KTX 63'
WHERE id = '51181c87-4627-4ef7-b346-0b96519998ee';

-- Update newer record to reference old dormitory
UPDATE public.dormitory_residents 
SET from_dormitory_id = '6c66b1da-a096-4cae-8648-a621d745a59b',
    transfer_reason = 'Chuyển từ KTX 81'
WHERE id = '20e728fc-21ab-45ef-8385-dba09c06d8f0';

-- Create a unique partial index to prevent duplicate active residents
CREATE UNIQUE INDEX IF NOT EXISTS idx_dormitory_residents_active_trainee 
ON public.dormitory_residents (trainee_id) 
WHERE status = 'Đang ở';