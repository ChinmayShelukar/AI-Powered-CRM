package com.cortexcrm.dto.response;

import java.math.BigDecimal;

/** Aggregate performance for one sales rep. */
public record TeamInsightRow(
        Long userId,
        String repName,
        long openDeals,
        BigDecimal openPipeline,
        BigDecimal wonRevenue,
        long activities30d
) {}
