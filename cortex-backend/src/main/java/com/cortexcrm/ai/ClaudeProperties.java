package com.cortexcrm.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "claude.api")
public record ClaudeProperties(
        String key,
        String model,
        String baseUrl
) {}
