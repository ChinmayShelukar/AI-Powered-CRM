CREATE TABLE activities (
    id              BIGSERIAL       PRIMARY KEY,
    type            VARCHAR(20)     NOT NULL
                    CHECK (type IN ('CALL', 'EMAIL', 'MEETING', 'NOTE')),
    notes           TEXT,
    activity_date   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    contact_id      BIGINT          REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id         BIGINT          REFERENCES deals(id)    ON DELETE CASCADE,
    created_by      BIGINT          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT activities_target_required CHECK (contact_id IS NOT NULL OR deal_id IS NOT NULL)
);

CREATE INDEX idx_activities_contact_id ON activities (contact_id);
CREATE INDEX idx_activities_deal_id    ON activities (deal_id);
CREATE INDEX idx_activities_created_by ON activities (created_by);
CREATE INDEX idx_activities_date       ON activities (activity_date DESC);
