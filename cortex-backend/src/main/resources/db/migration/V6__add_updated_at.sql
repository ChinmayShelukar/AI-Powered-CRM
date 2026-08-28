ALTER TABLE users     ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE contacts  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE deals     ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE users    SET updated_at = created_at;
UPDATE contacts SET updated_at = created_at;
UPDATE deals    SET updated_at = created_at;

CREATE INDEX idx_contacts_updated_at ON contacts (updated_at DESC);
CREATE INDEX idx_deals_updated_at    ON deals (updated_at DESC);
