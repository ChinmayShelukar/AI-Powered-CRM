package com.cortexcrm.service;

import com.cortexcrm.ai.ClaudeClient;
import com.cortexcrm.ai.ClaudeClient.Message;
import com.cortexcrm.ai.PromptBuilder;
import com.cortexcrm.entity.Activity;
import com.cortexcrm.entity.Intent;
import com.cortexcrm.entity.Sentiment;
import com.cortexcrm.repository.ActivityRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Classifies activity notes into sentiment + intent.
 * Uses Claude when CLAUDE_API_KEY is set; otherwise (or on any LLM error) falls back to a
 * deterministic keyword classifier so the feature always works offline and never blocks writes.
 */
@Service
@RequiredArgsConstructor
public class InsightService {

    private static final Logger log = LoggerFactory.getLogger(InsightService.class);

    private final ClaudeClient claude;
    private final PromptBuilder prompts;
    private final ActivityRepository activityRepository;
    private final ObjectMapper objectMapper;

    public record Classification(Sentiment sentiment, Intent intent) {}

    /** Never throws — LLM failure/absence degrades to keyword rules. */
    public Classification classify(String notes) {
        if (notes == null || notes.isBlank()) {
            return new Classification(Sentiment.NEUTRAL, Intent.OTHER);
        }
        try {
            String raw = claude.complete(prompts.classifySystem(), List.of(Message.user(notes)), 60);
            return parse(raw);
        } catch (Exception e) {
            // 503 (no key) or any API/parse error -> deterministic fallback.
            log.debug("classify fallback (LLM unavailable): {}", e.getMessage());
            return keyword(notes);
        }
    }

    /** Classify + persist any activities that have notes but no sentiment yet. Returns count updated. */
    @Transactional
    public int backfill() {
        List<Activity> pending = activityRepository.findAll().stream()
                .filter(a -> a.getSentiment() == null && a.getNotes() != null && !a.getNotes().isBlank())
                .toList();
        for (Activity a : pending) {
            Classification c = classify(a.getNotes());
            a.setSentiment(c.sentiment());
            a.setIntent(c.intent());
        }
        activityRepository.saveAll(pending);
        return pending.size();
    }

    private Classification parse(String raw) {
        try {
            String json = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
            JsonNode n = objectMapper.readTree(json);
            Sentiment s = Sentiment.valueOf(n.get("sentiment").asText().trim().toUpperCase(Locale.ROOT));
            Intent i = Intent.valueOf(n.get("intent").asText().trim().toUpperCase(Locale.ROOT));
            return new Classification(s, i);
        } catch (Exception e) {
            return keyword(raw);
        }
    }

    /** Deterministic keyword classifier — the offline fallback. */
    static Classification keyword(String notes) {
        String t = notes.toLowerCase(Locale.ROOT);
        Sentiment sentiment = Sentiment.NEUTRAL;
        if (containsAny(t, "cancel", "complaint", "unhappy", "angry", "refund", "disappointed", "issue", "problem", "delay")) {
            sentiment = Sentiment.NEGATIVE;
        } else if (containsAny(t, "great", "thanks", "thank you", "happy", "excited", "love", "interested", "signed", "approved")) {
            sentiment = Sentiment.POSITIVE;
        }

        Intent intent = Intent.OTHER;
        if (containsAny(t, "cancel", "churn", "leaving", "switch", "competitor instead", "not renew")) {
            intent = Intent.CHURN;
        } else if (containsAny(t, "complaint", "unhappy", "issue", "problem", "broken", "bug")) {
            intent = Intent.COMPLAINT;
        } else if (containsAny(t, "renew", "renewal", "extend contract", "contract end")) {
            intent = Intent.RENEWAL;
        } else if (containsAny(t, "upgrade", "add-on", "add on", "upsell", "more seats", "expand")) {
            intent = Intent.UPSELL;
        } else if (containsAny(t, "price", "pricing", "quote", "cost", "discount", "budget")) {
            intent = Intent.PRICING;
        }
        return new Classification(sentiment, intent);
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String n : needles) if (haystack.contains(n)) return true;
        return false;
    }
}
