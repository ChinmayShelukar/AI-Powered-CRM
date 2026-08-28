CREATE TABLE contacts (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(120)    NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(40),
    company         VARCHAR(160),
    status          VARCHAR(30)     NOT NULL DEFAULT 'NEW'
                    CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CUSTOMER', 'LOST')),
    assigned_to     BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_assigned_to ON contacts (assigned_to);
CREATE INDEX idx_contacts_status      ON contacts (status);
CREATE INDEX idx_contacts_email       ON contacts (email);
