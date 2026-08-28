package com.cortexcrm.dto.response;

import com.cortexcrm.entity.AuditAction;
import com.cortexcrm.entity.AuditLog;

import java.time.OffsetDateTime;

public record AuditLogResponse(
        Long id,
        Long userId,
        String userEmail,
        AuditAction action,
        String entityType,
        Long entityId,
        String oldValue,
        String newValue,
        OffsetDateTime occurredAt
) {
    public static AuditLogResponse from(AuditLog a) {
        return new AuditLogResponse(
                a.getId(),
                a.getUser() != null ? a.getUser().getId() : null,
                a.getUser() != null ? a.getUser().getEmail() : null,
                a.getAction(),
                a.getEntityType(),
                a.getEntityId(),
                a.getOldValue(),
                a.getNewValue(),
                a.getOccurredAt()
        );
    }
}
