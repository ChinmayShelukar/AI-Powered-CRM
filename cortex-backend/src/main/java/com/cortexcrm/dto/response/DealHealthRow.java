package com.cortexcrm.dto.response;

import java.util.List;

/**
 * Health assessment for an open deal.
 * level = HEALTHY / AT_RISK / STALLED from stage-dwell time, close-date slippage, and activity heat.
 */
public record DealHealthRow(
        Long dealId,
        String title,
        String stage,
        String level,
        List<String> reasons
) {}
