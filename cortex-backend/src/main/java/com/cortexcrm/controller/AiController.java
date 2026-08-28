package com.cortexcrm.controller;

import com.cortexcrm.ai.AiRateLimiter;
import com.cortexcrm.dto.request.AiQueryRequest;
import com.cortexcrm.dto.response.AiQueryResponse;
import com.cortexcrm.dto.response.AiTextResponse;
import com.cortexcrm.security.CurrentUserService;
import com.cortexcrm.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final AiRateLimiter rateLimiter;
    private final CurrentUserService currentUser;

    @PostMapping("/query")
    public AiQueryResponse query(@Valid @RequestBody AiQueryRequest req) {
        rateLimiter.check(currentUser.get().getId());
        return aiService.nlQuery(req.question());
    }

    @PostMapping("/summarize/{contactId}")
    public AiTextResponse summarize(@PathVariable Long contactId) {
        rateLimiter.check(currentUser.get().getId());
        return new AiTextResponse(aiService.summarizeContact(contactId));
    }

    @PostMapping("/draft-email/{contactId}")
    public AiTextResponse draftEmail(@PathVariable Long contactId) {
        rateLimiter.check(currentUser.get().getId());
        return new AiTextResponse(aiService.draftFollowUpEmail(contactId));
    }
}
