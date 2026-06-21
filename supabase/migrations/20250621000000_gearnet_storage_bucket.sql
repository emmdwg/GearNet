-- Supabase Storage bucket for GearNet uploads (Phase 3)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gearnet',
  'gearnet',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS gearnet_public_read ON storage.objects;
CREATE POLICY gearnet_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'gearnet');
