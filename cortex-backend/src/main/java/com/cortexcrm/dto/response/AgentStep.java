package com.cortexcrm.dto.response;

/** One step in the briefing agent's trace: what it did and what it found. */
public record AgentStep(
        int step,
        String action,
        String detail
) {}
