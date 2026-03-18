
-- 1. Make trainee-photos bucket PRIVATE
UPDATE storage.buckets SET public = false WHERE id = 'trainee-photos';

-- 2. Drop the old public policy
DROP POLICY IF EXISTS "Anyone can view trainee photos" ON storage.objects;

-- 3. Create new policies: only authenticated users can access
CREATE POLICY "Authenticated users can view trainee photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'trainee-photos');

CREATE POLICY "Authenticated users can upload trainee photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trainee-photos');

CREATE POLICY "Authenticated users can update trainee photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'trainee-photos');

CREATE POLICY "Authenticated users can delete trainee photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'trainee-photos');
