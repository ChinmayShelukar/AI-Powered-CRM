CREATE TABLE audit_logs (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(20)     NOT NULL
                    CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    entity_type     VARCHAR(50)     NOT NULL,
    entity_id       BIGINT          NOT NULL,
    old_value       JSONB,
    new_value       JSONB,
    occurred_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id        ON audit_logs (user_id);
CREATE INDEX idx_audit_entity         ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_occurred_at    ON audit_logs (occurred_at DESC);
