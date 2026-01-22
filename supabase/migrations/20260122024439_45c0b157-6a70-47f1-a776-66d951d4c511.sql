-- Create handbook entries table for storing training content
CREATE TABLE public.handbook_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    tags TEXT[],
    image_urls TEXT[],
    document_urls TEXT[],
    cost_info TEXT,
    support_policy TEXT,
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.handbook_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for handbook entries
CREATE POLICY "Everyone can view published handbook entries" 
ON public.handbook_entries 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage handbook entries" 
ON public.handbook_entries 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND (role = 'admin' OR is_primary_admin = true)
    )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_handbook_entries_updated_at
BEFORE UPDATE ON public.handbook_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for handbook files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('handbook-files', 'handbook-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for handbook files
CREATE POLICY "Handbook files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'handbook-files');

CREATE POLICY "Admins can upload handbook files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'handbook-files' 
    AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND (role = 'admin' OR is_primary_admin = true)
    )
);

CREATE POLICY "Admins can update handbook files" 
ON storage.objects 
FOR UPDATE 
USING (
    bucket_id = 'handbook-files' 
    AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND (role = 'admin' OR is_primary_admin = true)
    )
);

CREATE POLICY "Admins can delete handbook files" 
ON storage.objects 
FOR DELETE 
USING (
    bucket_id = 'handbook-files' 
    AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND (role = 'admin' OR is_primary_admin = true)
    )
);