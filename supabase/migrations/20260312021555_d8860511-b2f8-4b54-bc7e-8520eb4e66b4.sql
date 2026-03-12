
-- ================================================================
-- STEP 1: Enable Supabase Realtime Publication for key tables
-- ================================================================

-- Add tables to the supabase_realtime publication
-- (trainees, interview_history are likely already added; orders is new)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ================================================================
-- STEP 2: Set REPLICA IDENTITY FULL for optimized change detection
-- This ensures UPDATE payloads include old values for proper diffing
-- ================================================================
ALTER TABLE public.trainees REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.interview_history REPLICA IDENTITY FULL;
