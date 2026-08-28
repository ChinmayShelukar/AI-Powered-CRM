package com.cortexcrm.controller;

import com.cortexcrm.dto.response.BriefingResponse;
import com.cortexcrm.dto.response.DealHealthRow;
import com.cortexcrm.dto.response.RfmRow;
import com.cortexcrm.dto.response.RiskRow;
import com.cortexcrm.dto.response.TeamInsightResponse;
import com.cortexcrm.service.AnalyticsService;
import com.cortexcrm.service.BriefingService;
import com.cortexcrm.service.InsightService;
import com.cortexcrm.service.TeamInsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Read-only analytics endpoints (RFM, and further aggregates added per feature). */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final InsightService insightService;
    private final TeamInsightService teamInsightService;
    private final BriefingService briefingService;

    @GetMapping("/rfm")
    @PreAuthorize("isAuthenticated()")
    public List<RfmRow> rfm() {
        return analyticsService.rfm();
    }

    @GetMapping("/risk")
    @PreAuthorize("isAuthenticated()")
    public List<RiskRow> risk() {
        return analyticsService.risk();
    }

    @GetMapping("/deal-health")
    @PreAuthorize("isAuthenticated()")
    public List<DealHealthRow> dealHealth() {
        return analyticsService.dealHealth();
    }

    @GetMapping("/team-insights")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public TeamInsightResponse teamInsights() {
        return teamInsightService.teamInsights();
    }

    @GetMapping("/briefing")
    @PreAuthorize("isAuthenticated()")
    public BriefingResponse briefing() {
        return briefingService.run();
    }

    /** Classify + persist sentiment/intent for activities that don't have it yet. */
    @PostMapping("/classify-activities")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Map<String, Integer> classifyActivities() {
        return Map.of("updated", insightService.backfill());
    }
}
