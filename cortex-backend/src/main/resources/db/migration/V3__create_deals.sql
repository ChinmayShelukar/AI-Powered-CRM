CREATE TABLE deals (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(200)    NOT NULL,
    value           NUMERIC(15, 2)  NOT NULL DEFAULT 0,
    stage           VARCHAR(30)     NOT NULL DEFAULT 'PROSPECT'
                    CHECK (stage IN ('PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST')),
    close_date      DATE,
    contact_id      BIGINT          REFERENCES contacts(id) ON DELETE SET NULL,
    assigned_to     BIGINT          REFERENCES users(id)    ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deals_assigned_to ON deals (assigned_to);
CREATE INDEX idx_deals_contact_id  ON deals (contact_id);
CREATE INDEX idx_deals_stage       ON deals (stage);
