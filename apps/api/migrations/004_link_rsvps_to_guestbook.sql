ALTER TABLE guestbook_entries
  ALTER COLUMN password_verifier DROP NOT NULL;

ALTER TABLE guestbook_entries
  ADD COLUMN source_rsvp_id uuid;

ALTER TABLE rsvps
  ADD CONSTRAINT rsvps_id_invitation_unique UNIQUE (id, invitation_id);

ALTER TABLE guestbook_entries
  ADD CONSTRAINT guestbook_entries_source_rsvp_invitation_fk
  FOREIGN KEY (source_rsvp_id, invitation_id)
  REFERENCES rsvps(id, invitation_id)
  ON DELETE CASCADE;

ALTER TABLE guestbook_entries
  ADD CONSTRAINT guestbook_entries_source_rsvp_unique UNIQUE (source_rsvp_id);

ALTER TABLE guestbook_entries
  ADD CONSTRAINT guestbook_entries_deletion_auth_check CHECK (
    (password_verifier IS NOT NULL AND source_rsvp_id IS NULL)
    OR (password_verifier IS NULL AND source_rsvp_id IS NOT NULL)
  );
