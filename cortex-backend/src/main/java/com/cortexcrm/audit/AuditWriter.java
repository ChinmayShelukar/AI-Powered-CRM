package com.cortexcrm.audit;

import com.cortexcrm.entity.AuditAction;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
public class AuditWriter {

    private final JdbcTemplate jdbc;

    public void write(Long userId, AuditAction action, String entityType, Long entityId,
                      String oldValue, String newValue) {
        jdbc.update(
                "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, occurred_at) " +
                        "VALUES (?, ?, ?, ?, ?::jsonb, ?::jsonb, ?)",
                userId, action.name(), entityType, entityId, oldValue, newValue, OffsetDateTime.now()
        );
    }

    public Long lookupUserIdByEmail(String email) {
        if (email == null) return null;
        return jdbc.query(
                "SELECT id FROM users WHERE email = ?",
                rs -> rs.next() ? rs.getLong(1) : null,
                email
        );
    }
}
