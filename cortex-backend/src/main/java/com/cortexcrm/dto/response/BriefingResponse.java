package com.cortexcrm.dto.response;

import java.util.List;

/** Result of the briefing agent: the visible reasoning trace plus a headline summary. */
public record BriefingResponse(
        List<AgentStep> trace,
        String summary
) {}
