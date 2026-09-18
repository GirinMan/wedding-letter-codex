CREATE INDEX IF NOT EXISTS guest_uploads_public_page_idx
  ON guest_uploads (invitation_id, created_at DESC, id DESC)
  WHERE state = 'approved' AND deleted_at IS NULL;
