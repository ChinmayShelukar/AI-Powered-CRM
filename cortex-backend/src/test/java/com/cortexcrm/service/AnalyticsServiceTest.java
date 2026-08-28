package com.cortexcrm.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Unit test for RFM bucketing thresholds (pure logic, no Spring context). */
class AnalyticsServiceTest {

    private static BigDecimal money(long v) {
        return BigDecimal.valueOf(v);
    }

    @Test
    void champion_whenRecentFrequentBigSpend() {
        assertEquals("Champion", AnalyticsService.segment(10, 8, money(50_000)));
    }

    @Test
    void atRisk_whenStaleButValuable() {
        assertEquals("At-Risk", AnalyticsService.segment(120, 6, money(20_000)));
        assertEquals("At-Risk", AnalyticsService.segment(200, 1, money(15_000)));
    }

    @Test
    void loyal_whenFrequentNotStale() {
        assertEquals("Loyal", AnalyticsService.segment(60, 7, money(500)));
    }

    @Test
    void potential_whenRecentButLowFrequency() {
        assertEquals("Potential", AnalyticsService.segment(5, 1, money(0)));
    }

    @Test
    void needsAttention_whenNothingStandsOut() {
        assertEquals("Needs-Attention", AnalyticsService.segment(60, 1, money(0)));
    }

    @Test
    void nullMonetary_treatedAsZero() {
        assertEquals("Potential", AnalyticsService.segment(5, 1, null));
    }

    // --- risk scoring ---

    @Test
    void risk_high_whenStaleAndNegative() {
        var r = AnalyticsService.score(1L, "A", null, 120, 2, 5, 0, 1);
        assertEquals("HIGH", r.level());
    }

    @Test
    void risk_medium_whenSingleSignal() {
        var r = AnalyticsService.score(1L, "A", null, 60, 0, 5, 0, 1);
        assertEquals("MEDIUM", r.level());
    }

    @Test
    void risk_low_whenHealthy() {
        var r = AnalyticsService.score(1L, "A", null, 10, 0, 8, 0, 2);
        assertEquals("LOW", r.level());
        assertEquals("Healthy engagement", r.reasons().get(0));
    }

    @Test
    void risk_lostWithNoOpenDeal_addsSignal() {
        var r = AnalyticsService.score(1L, "A", null, 10, 0, 3, 1, 0);
        assertEquals("MEDIUM", r.level());
    }

    // --- deal health ---

    @Test
    void health_stalled_whenOverdue() {
        var h = AnalyticsService.health(1L, "D", "PROPOSAL", 5, true, 3);
        assertEquals("STALLED", h.level());
    }

    @Test
    void health_stalled_whenLongDwell() {
        var h = AnalyticsService.health(1L, "D", "PROPOSAL", 40, false, 3);
        assertEquals("STALLED", h.level());
    }

    @Test
    void health_atRisk_whenNoRecentActivity() {
        var h = AnalyticsService.health(1L, "D", "PROPOSAL", 5, false, 0);
        assertEquals("AT_RISK", h.level());
    }

    @Test
    void health_healthy_whenActiveAndFresh() {
        var h = AnalyticsService.health(1L, "D", "PROPOSAL", 3, false, 4);
        assertEquals("HEALTHY", h.level());
        assertEquals("On track", h.reasons().get(0));
    }
}
