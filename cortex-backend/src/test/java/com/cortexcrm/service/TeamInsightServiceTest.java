package com.cortexcrm.service;

import com.cortexcrm.dto.response.TeamInsightRow;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** Unit test for the deterministic team-insight narrative (offline fallback). */
class TeamInsightServiceTest {

    private static TeamInsightRow rep(String name, long open, long won, long acts) {
        return new TeamInsightRow(1L, name, open, BigDecimal.valueOf(open * 1000L),
                BigDecimal.valueOf(won), acts);
    }

    @Test
    void narrative_namesTopPerformerAndQuietRep() {
        // Sorted by won revenue desc, as the query returns.
        List<TeamInsightRow> reps = List.of(
                rep("Alice", 3, 50_000, 12),
                rep("Bob", 2, 10_000, 0)
        );
        String n = TeamInsightService.deterministicNarrative(reps);
        assertTrue(n.contains("Alice"), "should name top performer");
        assertTrue(n.contains("Bob"), "should flag quietest rep");
        assertTrue(n.toLowerCase().contains("no activity"), "should note Bob's zero activity");
    }
}
