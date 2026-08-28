ALTER TABLE activities ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
UPDATE activities SET updated_at = created_at;
CREATE INDEX idx_activities_updated_at ON activities (updated_at DESC);
