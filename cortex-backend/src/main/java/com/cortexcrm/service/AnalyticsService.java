package com.cortexcrm.service;

import com.cortexcrm.dto.response.DealHealthRow;
import com.cortexcrm.dto.response.RfmRow;
import com.cortexcrm.dto.response.RiskRow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Read-only analytics computed on demand from existing CRM data.
 * RFM is derived live (no persisted table) — recency from latest activity, frequency from
 * activity count, monetary from summed WON deal value per contact.
 */
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final JdbcTemplate jdbc;

    /** Per-contact RFM rows, most valuable (monetary desc) first. */
    @Transactional(readOnly = true)
    public List<RfmRow> rfm() {
        // Aggregate per contact; WON monetary via correlated subquery to avoid double-counting activity join.
        String sql = """
                SELECT c.id                                                              AS contact_id,
                       c.name                                                            AS name,
                       c.company                                                         AS company,
                       COALESCE(FLOOR(EXTRACT(EPOCH FROM (now() - MAX(a.activity_date))) / 86400), 9999) AS recency_days,
                       COUNT(a.id)                                                       AS frequency,
                       COALESCE((SELECT SUM(d.value) FROM deals d
                                  WHERE d.contact_id = c.id AND d.stage = 'WON'), 0)     AS monetary
                FROM contacts c
                LEFT JOIN activities a ON a.contact_id = c.id
                GROUP BY c.id, c.name, c.company
                ORDER BY monetary DESC, frequency DESC
                """;
        return jdbc.query(sql, (rs, i) -> {
            long recency = rs.getLong("recency_days");
            long frequency = rs.getLong("frequency");
            BigDecimal monetary = rs.getBigDecimal("monetary");
            return new RfmRow(
                    rs.getLong("contact_id"),
                    rs.getString("name"),
                    rs.getString("company"),
                    recency,
                    frequency,
                    monetary,
                    segment(recency, frequency, monetary)
            );
        });
    }

    /**
     * Bucket a contact from raw R/F/M. Simple, explainable thresholds (not quantiles) so the
     * result is stable on tiny datasets and needs no historical calibration.
     * ponytail: fixed thresholds, swap for quantile scoring if data volume makes them wrong.
     */
    static String segment(long recencyDays, long frequency, BigDecimal monetary) {
        boolean recent = recencyDays <= 30;
        boolean stale = recencyDays > 90;
        boolean frequent = frequency >= 5;
        boolean bigSpend = monetary != null && monetary.compareTo(BigDecimal.valueOf(10_000)) >= 0;

        if (recent && frequent && bigSpend) return "Champion";
        if (stale && (frequent || bigSpend)) return "At-Risk";
        if (frequent) return "Loyal";
        if (recent) return "Potential";
        return "Needs-Attention";
    }

    /** Per-contact churn risk, highest risk first. */
    @Transactional(readOnly = true)
    public List<RiskRow> risk() {
        String sql = """
                SELECT c.id   AS contact_id,
                       c.name AS name,
                       c.company AS company,
                       COALESCE(FLOOR(EXTRACT(EPOCH FROM (now() - MAX(a.activity_date))) / 86400), 9999) AS recency_days,
                       COUNT(a.id) FILTER (WHERE a.sentiment = 'NEGATIVE') AS neg_count,
                       COUNT(a.id) AS activity_count,
                       (SELECT COUNT(*) FROM deals d WHERE d.contact_id = c.id AND d.stage = 'LOST')  AS lost_deals,
                       (SELECT COUNT(*) FROM deals d WHERE d.contact_id = c.id
                          AND d.stage IN ('PROSPECT','QUALIFIED','PROPOSAL','NEGOTIATION'))           AS open_deals
                FROM contacts c
                LEFT JOIN activities a ON a.contact_id = c.id
                GROUP BY c.id, c.name, c.company
                """;
        List<RiskRow> rows = jdbc.query(sql, (rs, i) -> score(
                rs.getLong("contact_id"), rs.getString("name"), rs.getString("company"),
                rs.getLong("recency_days"), rs.getLong("neg_count"),
                rs.getLong("activity_count"), rs.getLong("lost_deals"), rs.getLong("open_deals")));
        // Highest risk first (HIGH > MEDIUM > LOW).
        rows.sort((a, b) -> rank(b.level()) - rank(a.level()));
        return rows;
    }

    private static int rank(String level) {
        return switch (level) { case "HIGH" -> 2; case "MEDIUM" -> 1; default -> 0; };
    }

    /**
     * Rule-blend churn score. Points from staleness + negative sentiment + lost-with-no-open deals.
     * ponytail: fixed point thresholds; move to a learned model only if these misfire at scale.
     */
    static RiskRow score(Long id, String name, String company, long recencyDays, long negCount,
                         long activityCount, long lostDeals, long openDeals) {
        int points = 0;
        List<String> reasons = new ArrayList<>();

        if (recencyDays >= 9999 && activityCount == 0) {
            points += 1;
            reasons.add("No activity logged");
        } else if (recencyDays > 90) {
            points += 2;
            reasons.add("No contact in " + recencyDays + " days");
        } else if (recencyDays > 45) {
            points += 1;
            reasons.add("Cooling off (" + recencyDays + " days since last contact)");
        }

        if (negCount >= 2) {
            points += 2;
            reasons.add(negCount + " negative interactions");
        } else if (negCount == 1) {
            points += 1;
            reasons.add("A negative interaction");
        }

        if (lostDeals > 0 && openDeals == 0) {
            points += 1;
            reasons.add("Lost deal, none open");
        }

        String level = points >= 3 ? "HIGH" : points >= 1 ? "MEDIUM" : "LOW";
        if (reasons.isEmpty()) reasons.add("Healthy engagement");
        return new RiskRow(id, name, company, level, reasons);
    }

    /** Health of open deals (excludes WON/LOST), least healthy first. */
    @Transactional(readOnly = true)
    public List<DealHealthRow> dealHealth() {
        String sql = """
                SELECT d.id AS deal_id,
                       d.title AS title,
                       d.stage AS stage,
                       COALESCE(FLOOR(EXTRACT(EPOCH FROM (now() - d.updated_at)) / 86400), 0) AS dwell_days,
                       (d.close_date IS NOT NULL AND d.close_date < CURRENT_DATE)              AS overdue,
                       (SELECT COUNT(*) FROM activities a
                          WHERE a.deal_id = d.id AND a.activity_date > now() - INTERVAL '30 days') AS recent_activity
                FROM deals d
                WHERE d.stage IN ('PROSPECT','QUALIFIED','PROPOSAL','NEGOTIATION')
                """;
        List<DealHealthRow> rows = jdbc.query(sql, (rs, i) -> health(
                rs.getLong("deal_id"), rs.getString("title"), rs.getString("stage"),
                rs.getLong("dwell_days"), rs.getBoolean("overdue"), rs.getLong("recent_activity")));
        rows.sort((a, b) -> healthRank(b.level()) - healthRank(a.level()));
        return rows;
    }

    private static int healthRank(String level) {
        return switch (level) { case "STALLED" -> 2; case "AT_RISK" -> 1; default -> 0; };
    }

    /**
     * Open-deal health blend: stage-dwell (updated_at proxy), close-date slippage, activity heat.
     * ponytail: uses updated_at as stage-dwell proxy — add a stage_history table if true
     * per-stage dwell time is needed.
     */
    static DealHealthRow health(Long id, String title, String stage,
                                long dwellDays, boolean overdue, long recentActivity) {
        List<String> reasons = new ArrayList<>();
        boolean stalled = false, atRisk = false;

        if (overdue) {
            stalled = true;
            reasons.add("Past expected close date");
        }
        if (dwellDays > 30) {
            stalled = true;
            reasons.add("No update in " + dwellDays + " days");
        } else if (dwellDays > 14) {
            atRisk = true;
            reasons.add("Slowing (" + dwellDays + " days since update)");
        }
        if (recentActivity == 0) {
            atRisk = true;
            reasons.add("No activity in 30 days");
        }

        String level = stalled ? "STALLED" : atRisk ? "AT_RISK" : "HEALTHY";
        if (reasons.isEmpty()) reasons.add("On track");
        return new DealHealthRow(id, title, stage, level, reasons);
    }
}
