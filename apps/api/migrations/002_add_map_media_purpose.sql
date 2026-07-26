ALTER TABLE media_assets
  DROP CONSTRAINT IF EXISTS media_assets_purpose_check;

ALTER TABLE media_assets
  ADD CONSTRAINT media_assets_purpose_check
  CHECK (
    purpose IN (
      'hero',
      'greeting',
      'interview',
      'timeline',
      'map',
      'gallery',
      'middle',
      'closing',
      'music'
    )
  );
