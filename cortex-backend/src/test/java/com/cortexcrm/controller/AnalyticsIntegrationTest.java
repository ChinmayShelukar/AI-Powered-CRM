package com.cortexcrm.controller;

import com.cortexcrm.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** End-to-end HTTP: real Postgres (Flyway), Spring Security JWT, analytics endpoints. */
@SpringBootTest
@AutoConfigureMockMvc
@ContextConfiguration(initializers = AbstractIntegrationTest.Initializer.class)
class AnalyticsIntegrationTest extends AbstractIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    private String registerAndGetToken(String email) throws Exception {
        String body = """
                {"name":"Test User","email":"%s","password":"password1"}
                """.formatted(email);
        String json = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = mapper.readTree(json);
        return node.get("token").asText();
    }

    @Test
    void unauthenticated_isRejected() throws Exception {
        mvc.perform(get("/api/analytics/rfm"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticated_canReadRfmAndBriefing() throws Exception {
        String token = registerAndGetToken("rfm-user@x.com");

        mvc.perform(get("/api/analytics/rfm").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));

        mvc.perform(get("/api/analytics/briefing").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trace").isArray())
                .andExpect(jsonPath("$.summary").isString());
    }

    @Test
    void teamInsights_forbiddenForSalesRep() throws Exception {
        // register() assigns SALES_REP -> team-insights requires MANAGER/ADMIN.
        String token = registerAndGetToken("rep-user@x.com");
        mvc.perform(get("/api/analytics/team-insights").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
