ALTER TABLE guest_uploads
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS guest_uploads_active_invitation_created_idx
  ON guest_uploads(invitation_id, created_at DESC)
  WHERE deleted_at IS NULL;
