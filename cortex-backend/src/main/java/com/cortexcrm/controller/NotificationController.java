package com.cortexcrm.controller;

import com.cortexcrm.security.CurrentUserService;
import com.cortexcrm.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private static final long STREAM_TIMEOUT_MS = 30 * 60 * 1000L;

    private final SseEmitterRegistry registry;
    private final CurrentUserService currentUser;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter stream() {
        Long userId = currentUser.get().getId();
        return registry.register(userId, STREAM_TIMEOUT_MS);
    }
}
