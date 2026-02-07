-- Thêm 3 cột cho thông tin công ty tiến cử (nhập tay, không liên kết với bảng companies)
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS recommending_company_name text,
ADD COLUMN IF NOT EXISTS recommending_representative text,
ADD COLUMN IF NOT EXISTS recommending_position text;

COMMENT ON COLUMN public.trainees.recommending_company_name IS 'Tên công ty tiến cử (nhập tay)';
COMMENT ON COLUMN public.trainees.recommending_representative IS 'Tên người đại diện công ty tiến cử (nhập tay)';
COMMENT ON COLUMN public.trainees.recommending_position IS 'Chức vụ người đại diện công ty tiến cử (nhập tay)';