package com.cortexcrm.dto.response;

import java.util.List;

/**
 * Per-contact churn/risk assessment.
 * level = LOW / MEDIUM / HIGH from a rule blend over activity staleness, negative sentiment,
 * and deal outcomes. reasons = human-readable signals that drove the score.
 */
public record RiskRow(
        Long contactId,
        String name,
        String company,
        String level,
        List<String> reasons
) {}
