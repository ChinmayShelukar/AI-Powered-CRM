package com.cortexcrm;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Shared Postgres Testcontainer for integration tests. Started once (static singleton) and wired
 * into Spring via an initializer. JWT secret + empty Claude key are set so the context boots without
 * external services (AI endpoints degrade; Redis beans autoconfigure lazily).
 */
public abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("cortexcrm")
                    .withUsername("cortex")
                    .withPassword("cortex");

    static {
        POSTGRES.start();
    }

    public static class Initializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override
        public void initialize(ConfigurableApplicationContext ctx) {
            TestPropertyValues.of(
                    "spring.datasource.url=" + POSTGRES.getJdbcUrl(),
                    "spring.datasource.username=" + POSTGRES.getUsername(),
                    "spring.datasource.password=" + POSTGRES.getPassword(),
                    "app.jwt.secret=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
                    "claude.api.key="
            ).applyTo(ctx.getEnvironment());
        }
    }
}
