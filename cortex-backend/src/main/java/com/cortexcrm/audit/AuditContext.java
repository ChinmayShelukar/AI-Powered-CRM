package com.cortexcrm.audit;

import com.cortexcrm.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.ApplicationContext;

public final class AuditContext {

    private static ApplicationContext context;
    private static final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private AuditContext() {}

    public static void init(ApplicationContext ctx) {
        context = ctx;
    }

    public static AuditLogRepository repository() {
        return context.getBean(AuditLogRepository.class);
    }

    public static <T> T bean(Class<T> type) {
        return context.getBean(type);
    }

    public static ObjectMapper json() {
        return mapper;
    }
}
