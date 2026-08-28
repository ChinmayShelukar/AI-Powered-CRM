package com.cortexcrm.service;

import com.cortexcrm.dto.response.AgentStep;
import com.cortexcrm.dto.response.BriefingResponse;
import com.cortexcrm.dto.response.DealHealthRow;
import com.cortexcrm.dto.response.RiskRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Deterministic "briefing agent": runs a fixed sequence of analytics steps and records each as a
 * visible trace, then synthesizes a headline summary. No LLM, no external infra — fully free.
 * Demonstrates a multi-step agent trace over existing tools (RFM, churn risk, deal health).
 */
@Service
@RequiredArgsConstructor
public class BriefingService {

    private final AnalyticsService analytics;

    @Transactional(readOnly = true)
    public BriefingResponse run() {
        List<AgentStep> trace = new ArrayList<>();
        int step = 1;

        // Step 1: scan churn risk.
        List<RiskRow> risk = analytics.risk();
        long highRisk = risk.stream().filter(r -> "HIGH".equals(r.level())).count();
        long medRisk = risk.stream().filter(r -> "MEDIUM".equals(r.level())).count();
        trace.add(new AgentStep(step++, "Scan churn risk",
                highRisk + " high-risk, " + medRisk + " medium-risk contacts"));

        // Step 2: scan open-deal health.
        List<DealHealthRow> health = analytics.dealHealth();
        long stalled = health.stream().filter(d -> "STALLED".equals(d.level())).count();
        long atRisk = health.stream().filter(d -> "AT_RISK".equals(d.level())).count();
        trace.add(new AgentStep(step++, "Assess open-deal health",
                stalled + " stalled, " + atRisk + " at-risk deals"));

        // Step 3: pick the single most urgent item.
        String topAction;
        if (stalled > 0) {
            DealHealthRow d = health.stream().filter(x -> "STALLED".equals(x.level())).findFirst().orElseThrow();
            topAction = "Revive stalled deal \"" + d.title() + "\" (" + String.join("; ", d.reasons()) + ")";
        } else if (highRisk > 0) {
            RiskRow r = risk.stream().filter(x -> "HIGH".equals(x.level())).findFirst().orElseThrow();
            topAction = "Re-engage high-risk contact " + r.name() + " (" + String.join("; ", r.reasons()) + ")";
        } else if (atRisk > 0 || medRisk > 0) {
            topAction = "Follow up on cooling deals/contacts before they slip";
        } else {
            topAction = "Pipeline healthy — focus on advancing open deals";
        }
        trace.add(new AgentStep(step++, "Prioritize next action", topAction));

        String summary = "Today: " + highRisk + " contacts need attention and " + stalled
                + " deals are stalled. Recommended first move — " + topAction + ".";
        return new BriefingResponse(trace, summary);
    }
}
