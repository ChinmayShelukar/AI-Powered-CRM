package com.cortexcrm.service;

import com.cortexcrm.entity.Intent;
import com.cortexcrm.entity.Sentiment;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Unit test for the deterministic keyword classifier (offline fallback). */
class InsightServiceTest {

    @Test
    void negativeComplaint() {
        var c = InsightService.keyword("Customer filed a complaint, very unhappy about the bug");
        assertEquals(Sentiment.NEGATIVE, c.sentiment());
        assertEquals(Intent.COMPLAINT, c.intent());
    }

    @Test
    void churnSignal() {
        var c = InsightService.keyword("They want to cancel and switch to a competitor instead");
        assertEquals(Sentiment.NEGATIVE, c.sentiment());
        assertEquals(Intent.CHURN, c.intent());
    }

    @Test
    void positiveRenewal() {
        var c = InsightService.keyword("Happy to renew the contract, thanks for the great support");
        assertEquals(Sentiment.POSITIVE, c.sentiment());
        assertEquals(Intent.RENEWAL, c.intent());
    }

    @Test
    void pricingNeutral() {
        var c = InsightService.keyword("Asked for a quote and pricing details");
        assertEquals(Sentiment.NEUTRAL, c.sentiment());
        assertEquals(Intent.PRICING, c.intent());
    }

    @Test
    void upsell() {
        var c = InsightService.keyword("Interested in an upgrade with more seats");
        assertEquals(Intent.UPSELL, c.intent());
    }

    @Test
    void emptyIsNeutralOther() {
        var c = InsightService.keyword("");
        assertEquals(Sentiment.NEUTRAL, c.sentiment());
        assertEquals(Intent.OTHER, c.intent());
    }
}
