package com.cortexcrm.ai;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Smoke test: prompts are non-empty and the NL-to-SQL prompt scopes to the current user. */
class PromptBuilderTest {

    private final PromptBuilder prompts = new PromptBuilder();

    @Test
    void corePromptsNonEmpty() {
        assertFalse(prompts.summarizeSystem().isBlank());
        assertFalse(prompts.draftEmailSystem().isBlank());
        assertFalse(prompts.classifySystem().isBlank());
        assertFalse(prompts.teamInsightSystem().isBlank());
    }

    @Test
    void classifyPromptRequestsJsonWithBothFields() {
        String p = prompts.classifySystem();
        assertTrue(p.contains("sentiment"));
        assertTrue(p.contains("intent"));
    }

    @Test
    void nlToSqlPromptIncludesUserScoping() {
        String p = prompts.nlToSqlSystem(42L, "Ada", "ada@x.com", "SALES_REP");
        assertTrue(p.contains("42") || p.contains("ada@x.com"),
                "schema prompt should embed the requesting user's identity for row scoping");
    }
}
