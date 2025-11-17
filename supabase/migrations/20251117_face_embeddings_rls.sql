-- Enable RLS on face_embeddings table
ALTER TABLE face_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own face embeddings
CREATE POLICY "Users can insert their own face embeddings"
ON face_embeddings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own face embeddings
CREATE POLICY "Users can view their own face embeddings"
ON face_embeddings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own face embeddings
CREATE POLICY "Users can update their own face embeddings"
ON face_embeddings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own face embeddings
CREATE POLICY "Users can delete their own face embeddings"
ON face_embeddings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
