-- Create storage bucket for trainee photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('trainee-photos', 'trainee-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for trainee photos bucket
CREATE POLICY "Anyone can view trainee photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'trainee-photos');

CREATE POLICY "Anyone can upload trainee photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'trainee-photos');

CREATE POLICY "Anyone can update trainee photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'trainee-photos');

CREATE POLICY "Anyone can delete trainee photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'trainee-photos');