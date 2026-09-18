-- Publish new uploads immediately; administrators can still reject them later.
ALTER TABLE guest_uploads ALTER COLUMN state SET DEFAULT 'approved';

-- Release the existing review queue without restoring rejected or deleted photos.
UPDATE guest_uploads SET state = 'approved'
WHERE state = 'pending' AND deleted_at IS NULL;
