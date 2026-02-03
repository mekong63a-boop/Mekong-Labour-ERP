-- Tạo bảng sở thích (hobbies)
CREATE TABLE public.hobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hobbies ENABLE ROW LEVEL SECURITY;

-- Policies for hobbies
CREATE POLICY "Everyone can view hobbies" ON public.hobbies FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert hobbies" ON public.hobbies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update hobbies" ON public.hobbies FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete hobbies" ON public.hobbies FOR DELETE USING (auth.role() = 'authenticated');

-- Tạo bảng nơi cấp CCCD (cccd_places)
CREATE TABLE public.cccd_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cccd_places ENABLE ROW LEVEL SECURITY;

-- Policies for cccd_places
CREATE POLICY "Everyone can view cccd_places" ON public.cccd_places FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert cccd_places" ON public.cccd_places FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update cccd_places" ON public.cccd_places FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete cccd_places" ON public.cccd_places FOR DELETE USING (auth.role() = 'authenticated');

-- Tạo bảng nơi cấp hộ chiếu (passport_places)
CREATE TABLE public.passport_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.passport_places ENABLE ROW LEVEL SECURITY;

-- Policies for passport_places
CREATE POLICY "Everyone can view passport_places" ON public.passport_places FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert passport_places" ON public.passport_places FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update passport_places" ON public.passport_places FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete passport_places" ON public.passport_places FOR DELETE USING (auth.role() = 'authenticated');

-- Thêm một số dữ liệu mẫu cho sở thích
INSERT INTO public.hobbies (name) VALUES 
  ('Đọc sách'),
  ('Nghe nhạc'),
  ('Xem phim'),
  ('Thể thao'),
  ('Nấu ăn'),
  ('Du lịch'),
  ('Chơi game'),
  ('Vẽ tranh');

-- Thêm một số nơi cấp CCCD phổ biến
INSERT INTO public.cccd_places (name) VALUES 
  ('Cục Cảnh sát QLHC về TTXH'),
  ('Công an tỉnh Hà Nội'),
  ('Công an tỉnh TP. Hồ Chí Minh'),
  ('Công an tỉnh Đà Nẵng');

-- Thêm nơi cấp hộ chiếu phổ biến
INSERT INTO public.passport_places (name) VALUES 
  ('Cục Quản lý Xuất nhập cảnh'),
  ('Phòng Quản lý Xuất nhập cảnh - Công an TP. Hà Nội'),
  ('Phòng Quản lý Xuất nhập cảnh - Công an TP. Hồ Chí Minh');