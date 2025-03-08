-- Create a storage bucket for user content
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-content', 'user-content', true);

-- Create policy to allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-content' AND 
    (storage.foldername(name))[1] = 'avatars' AND
    (storage.filename(name) ILIKE (auth.uid() || '-avatar%'))
  );

-- Create policy to allow public read access to avatars
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'user-content' AND (storage.foldername(name))[1] = 'avatars');

-- Create policy to allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'user-content' AND (storage.foldername(name))[1] = 'avatars' AND (storage.filename(name) ILIKE (auth.uid() || '-avatar%')))
  WITH CHECK (bucket_id = 'user-content' AND (storage.foldername(name))[1] = 'avatars' AND (storage.filename(name) ILIKE (auth.uid() || '-avatar%')));

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'user-content' AND (storage.foldername(name))[1] = 'avatars' AND (storage.filename(name) ILIKE (auth.uid() || '-avatar%'))); 