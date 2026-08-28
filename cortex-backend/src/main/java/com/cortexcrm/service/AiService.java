package com.cortexcrm.service;

import com.cortexcrm.ai.AiMemoryService;
import com.cortexcrm.ai.ClaudeClient;
import com.cortexcrm.ai.ClaudeClient.Message;
import com.cortexcrm.ai.PromptBuilder;
import com.cortexcrm.ai.SqlGuard;
import com.cortexcrm.dto.response.AiQueryResponse;
import com.cortexcrm.entity.Activity;
import com.cortexcrm.entity.Contact;
import com.cortexcrm.repository.ActivityRepository;
import com.cortexcrm.repository.ContactRepository;
import com.cortexcrm.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private static final int SUMMARY_MAX_TOKENS = 500;
    private static final int EMAIL_MAX_TOKENS = 800;
    private static final int SQL_MAX_TOKENS = 600;
    private static final int RECENT_ACTIVITY_LIMIT = 10;

    private final ClaudeClient claude;
    private final PromptBuilder prompts;
    private final SqlGuard sqlGuard;
    private final AiMemoryService memory;
    private final ContactRepository contactRepository;
    private final ActivityRepository activityRepository;
    private final JdbcTemplate jdbc;
    private final CurrentUserService currentUser;

    public String summarizeContact(Long contactId) {
        Contact c = loadContact(contactId);
        List<Activity> activities = activityRepository
                .findByContactIdOrderByActivityDateDesc(c.getId())
                .stream().limit(RECENT_ACTIVITY_LIMIT).toList();

        return claude.complete(
                prompts.summarizeSystem(),
                List.of(Message.user(prompts.contactBlock(c, activities))),
                SUMMARY_MAX_TOKENS
        ).trim();
    }

    public String draftFollowUpEmail(Long contactId) {
        Contact c = loadContact(contactId);
        List<Activity> activities = activityRepository
                .findByContactIdOrderByActivityDateDesc(c.getId())
                .stream().limit(RECENT_ACTIVITY_LIMIT).toList();

        return claude.complete(
                prompts.draftEmailSystem(),
                List.of(Message.user(prompts.contactBlock(c, activities))),
                EMAIL_MAX_TOKENS
        ).trim();
    }

    private static final String CHAT_PREFIX = "CHAT:";

    public AiQueryResponse nlQuery(String question) {
        var user = currentUser.get();
        Long userId = user.getId();

        String systemPrompt = prompts.nlToSqlSystem(
                userId, user.getName(), user.getEmail(), user.getRole().name());

        List<Message> history = new ArrayList<>(memory.recent(userId));
        history.add(Message.user(question));

        String raw = claude.complete(systemPrompt, history, SQL_MAX_TOKENS).trim();

        // Detect conversational responses: explicit CHAT: prefix OR anything that doesn't
        // look like SQL (Claude sometimes omits the prefix for very short inputs).
        boolean explicitChat = raw.startsWith(CHAT_PREFIX);
        String upperRaw = raw.toUpperCase();
        boolean looksLikeSql = upperRaw.startsWith("SELECT")
                || upperRaw.startsWith("WITH ")
                || upperRaw.startsWith("(SELECT");

        if (explicitChat || !looksLikeSql) {
            String chatText = explicitChat ? raw.substring(CHAT_PREFIX.length()).trim() : raw;
            memory.append(userId, Message.user(question));
            memory.append(userId, Message.assistant(chatText));
            return new AiQueryResponse(question, null, List.of(), 0, chatText);
        }

        String sql = sqlGuard.validate(raw);

        // Sentinel: Claude couldn't map to SQL
        if (sql.toUpperCase().contains("CANNOT ANSWER")) {
            String helpText = "I can only answer questions about your CRM data — contacts, deals, activities, and users. Try something like \"Show my open deals\" or \"Which contacts haven't been contacted recently?\"";
            memory.append(userId, Message.user(question));
            memory.append(userId, Message.assistant(helpText));
            return new AiQueryResponse(question, null, List.of(), 0, helpText);
        }

        List<Map<String, Object>> rows;
        try {
            rows = jdbc.queryForList(sql);
        } catch (Exception firstError) {
            log.warn("SQL execution failed (attempt 1), retrying: {}", firstError.getMessage());
            sql = retryWithError(systemPrompt, history, sql, firstError.getMessage());
            try {
                rows = jdbc.queryForList(sql);
            } catch (Exception secondError) {
                log.error("SQL execution failed after retry: {}", secondError.getMessage());
                String fallbackText = "I had trouble running that query. Could you rephrase it? For example: \"Show my deals closing this month\" or \"How many contacts do I have?\"";
                return new AiQueryResponse(question, null, List.of(), 0, fallbackText);
            }
        }

        memory.append(userId, Message.user(question));
        memory.append(userId, Message.assistant(sql));

        return new AiQueryResponse(question, sql, rows, rows.size(), null);
    }

    private String generateAndValidate(String systemPrompt, List<Message> history) {
        String raw = claude.complete(systemPrompt, history, SQL_MAX_TOKENS).trim();
        if (raw.startsWith(CHAT_PREFIX)) return raw; // pass through, caller handles
        return sqlGuard.validate(raw);
    }

    private String retryWithError(String systemPrompt, List<Message> history,
                                  String failedSql, String errorMessage) {
        List<Message> retryHistory = new ArrayList<>(history);
        retryHistory.add(Message.assistant(failedSql));
        retryHistory.add(Message.user(
                "That SQL failed with: " + errorMessage + ". Output only the corrected SQL query."));
        return generateAndValidate(systemPrompt, retryHistory);
    }

    private Contact loadContact(Long id) {
        Contact c = contactRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Contact not found"));
        Long ownerId = c.getAssignedTo() != null ? c.getAssignedTo().getId() : null;
        currentUser.requireAccessTo(ownerId, "contact");
        return c;
    }
}
