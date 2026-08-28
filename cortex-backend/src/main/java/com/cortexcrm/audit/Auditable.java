package com.cortexcrm.audit;

import java.util.Map;

public interface Auditable {
    Long getId();

    default String auditEntityType() {
        return getClass().getSimpleName();
    }

    Map<String, Object> auditSnapshot();
}
