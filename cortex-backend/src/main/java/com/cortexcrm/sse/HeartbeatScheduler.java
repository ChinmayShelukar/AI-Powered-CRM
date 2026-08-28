package com.cortexcrm.sse;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HeartbeatScheduler {

    private final SseEmitterRegistry registry;

    @Scheduled(fixedRate = 30_000)
    public void heartbeat() {
        registry.heartbeat();
    }
}
