package com.cortexcrm.service;

import com.cortexcrm.ai.ClaudeClient;
import com.cortexcrm.ai.ClaudeClient.Message;
import com.cortexcrm.ai.PromptBuilder;
import com.cortexcrm.dto.response.TeamInsightResponse;
import com.cortexcrm.dto.response.TeamInsightRow;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Manager-facing team analytics: per-rep aggregates plus a narrative summary.
 * Narrative uses Claude when CLAUDE_API_KEY is set; otherwise a deterministic summary is returned.
 */
@Service
@RequiredArgsConstructor
public class TeamInsightService {

    private static final Logger log = LoggerFactory.getLogger(TeamInsightService.class);

    private final JdbcTemplate jdbc;
    private final ClaudeClient claude;
    private final PromptBuilder prompts;

    @Transactional(readOnly = true)
    public TeamInsightResponse teamInsights() {
        String sql = """
                SELECT u.id AS user_id, u.name AS rep,
                       (SELECT COUNT(*) FROM deals d WHERE d.assigned_to = u.id
                          AND d.stage IN ('PROSPECT','QUALIFIED','PROPOSAL','NEGOTIATION'))                    AS open_deals,
                       (SELECT COALESCE(SUM(d.value),0) FROM deals d WHERE d.assigned_to = u.id
                          AND d.stage IN ('PROSPECT','QUALIFIED','PROPOSAL','NEGOTIATION'))                    AS open_pipeline,
                       (SELECT COALESCE(SUM(d.value),0) FROM deals d WHERE d.assigned_to = u.id AND d.stage = 'WON') AS won_revenue,
                       (SELECT COUNT(*) FROM activities a WHERE a.created_by = u.id
                          AND a.activity_date > now() - INTERVAL '30 days')                                    AS activities_30d
                FROM users u
                WHERE u.role = 'SALES_REP'
                ORDER BY won_revenue DESC
                """;
        List<TeamInsightRow> reps = jdbc.query(sql, (rs, i) -> new TeamInsightRow(
                rs.getLong("user_id"),
                rs.getString("rep"),
                rs.getLong("open_deals"),
                rs.getBigDecimal("open_pipeline"),
                rs.getBigDecimal("won_revenue"),
                rs.getLong("activities_30d")));

        return new TeamInsightResponse(reps, narrative(reps));
    }

    private String narrative(List<TeamInsightRow> reps) {
        if (reps.isEmpty()) return "No sales reps to report on yet.";
        try {
            return claude.complete(prompts.teamInsightSystem(), List.of(Message.user(metricsBlock(reps))), 200);
        } catch (Exception e) {
            log.debug("team narrative fallback (LLM unavailable): {}", e.getMessage());
            return deterministicNarrative(reps);
        }
    }

    private String metricsBlock(List<TeamInsightRow> reps) {
        StringBuilder sb = new StringBuilder("Team metrics:\n");
        for (TeamInsightRow r : reps) {
            sb.append("- ").append(r.repName())
              .append(": open=").append(r.openDeals())
              .append(", pipeline=").append(r.openPipeline())
              .append(", won=").append(r.wonRevenue())
              .append(", activities30d=").append(r.activities30d()).append("\n");
        }
        return sb.toString();
    }

    /** Deterministic fallback narrative (no LLM). */
    static String deterministicNarrative(List<TeamInsightRow> reps) {
        TeamInsightRow top = reps.get(0); // sorted by won revenue desc
        BigDecimal teamWon = reps.stream().map(TeamInsightRow::wonRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long teamOpen = reps.stream().mapToLong(TeamInsightRow::openDeals).sum();
        TeamInsightRow quietest = reps.stream()
                .min((a, b) -> Long.compare(a.activities30d(), b.activities30d()))
                .orElse(top);

        StringBuilder sb = new StringBuilder();
        sb.append(top.repName()).append(" leads with ").append(money(top.wonRevenue())).append(" in won revenue. ");
        sb.append("The team has ").append(teamOpen).append(" open deals and ")
          .append(money(teamWon)).append(" closed-won total. ");
        if (quietest.activities30d() == 0) {
            sb.append(quietest.repName()).append(" logged no activity in the last 30 days — check in.");
        } else {
            sb.append("Lowest recent activity: ").append(quietest.repName())
              .append(" (").append(quietest.activities30d()).append(" in 30 days).");
        }
        return sb.toString();
    }

    /** Compact currency for narrative text: $108k, $60k, $950. */
    static String money(BigDecimal v) {
        if (v == null) return "$0";
        long n = v.longValue();
        if (n >= 1000) return "$" + Math.round(n / 1000.0) + "k";
        return "$" + n;
    }
}
