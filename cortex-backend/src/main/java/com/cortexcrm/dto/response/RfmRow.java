package com.cortexcrm.dto.response;

import java.math.BigDecimal;

/**
 * One contact's RFM analytics row.
 * recencyDays = days since last activity; frequency = activity count; monetary = sum of WON deal value.
 * segment = derived bucket (Champion / Loyal / Potential / At-Risk / Needs-Attention).
 */
public record RfmRow(
        Long contactId,
        String name,
        String company,
        long recencyDays,
        long frequency,
        BigDecimal monetary,
        String segment
) {}
