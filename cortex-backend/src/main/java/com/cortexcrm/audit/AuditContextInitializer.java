package com.cortexcrm.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
@RequiredArgsConstructor
public class AuditContextInitializer {

    private final ApplicationContext applicationContext;

    @PostConstruct
    void init() {
        AuditContext.init(applicationContext);
    }
}
