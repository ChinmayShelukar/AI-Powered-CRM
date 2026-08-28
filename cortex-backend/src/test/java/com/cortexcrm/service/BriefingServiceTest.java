package com.cortexcrm.service;

import com.cortexcrm.dto.response.DealHealthRow;
import com.cortexcrm.dto.response.RiskRow;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/** Unit test for the deterministic briefing agent, with AnalyticsService mocked. */
@ExtendWith(MockitoExtension.class)
class BriefingServiceTest {

    @Mock AnalyticsService analytics;
    @InjectMocks BriefingService briefing;

    @Test
    void prioritizesStalledDealFirst() {
        when(analytics.risk()).thenReturn(List.of(
                new RiskRow(1L, "Acme", "Acme Co", "HIGH", List.of("No contact in 120 days"))));
        when(analytics.dealHealth()).thenReturn(List.of(
                new DealHealthRow(9L, "Big Deal", "PROPOSAL", "STALLED", List.of("Past expected close date"))));

        var b = briefing.run();

        assertEquals(3, b.trace().size());
        assertTrue(b.summary().contains("Big Deal"), "stalled deal should drive the top action");
        assertTrue(b.trace().get(0).action().contains("churn"), "step 1 scans churn");
    }

    @Test
    void healthyPipelineGivesPositiveSummary() {
        when(analytics.risk()).thenReturn(List.of());
        when(analytics.dealHealth()).thenReturn(List.of());

        var b = briefing.run();

        assertEquals(3, b.trace().size());
        assertTrue(b.summary().toLowerCase().contains("healthy"), "no issues -> healthy message");
    }
}
