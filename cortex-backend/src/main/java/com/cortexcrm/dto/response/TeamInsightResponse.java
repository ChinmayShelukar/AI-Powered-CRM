package com.cortexcrm.dto.response;

import java.util.List;

/** Team analytics: per-rep rows plus a manager-facing narrative summary. */
public record TeamInsightResponse(
        List<TeamInsightRow> reps,
        String narrative
) {}
