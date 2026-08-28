package com.cortexcrm.audit;

import com.cortexcrm.entity.AuditAction;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class AuditEntityListener {

    private static final Logger log = LoggerFactory.getLogger(AuditEntityListener.class);

    @PostPersist
    public void onCreate(Object entity) { log(entity, AuditAction.CREATE); }

    @PostUpdate
    public void onUpdate(Object entity) { log(entity, AuditAction.UPDATE); }

    @PostRemove
    public void onDelete(Object entity) { log(entity, AuditAction.DELETE); }

    private void log(Object entity, AuditAction action) {
        if (!(entity instanceof Auditable a)) return;

        try {
            String snapshot = AuditContext.json().writeValueAsString(a.auditSnapshot());
            String oldValue = action == AuditAction.DELETE || action == AuditAction.UPDATE ? snapshot : null;
            String newValue = action == AuditAction.CREATE || action == AuditAction.UPDATE ? snapshot : null;

            AuditContext.bean(AuditWriter.class)
                    .write(currentUserId(), action, a.auditEntityType(), a.getId(), oldValue, newValue);
        } catch (Exception e) {
            log.warn("[AUDIT] Failed to record {} on {}: {}", action, entity.getClass().getSimpleName(), e.getMessage());
        }
    }

    private Long currentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) return null;
            return AuditContext.bean(AuditWriter.class).lookupUserIdByEmail(auth.getName());
        } catch (Exception e) {
            return null;
        }
    }
}
