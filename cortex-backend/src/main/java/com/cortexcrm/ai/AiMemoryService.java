package com.cortexcrm.ai;

import com.cortexcrm.ai.ClaudeClient.Message;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiMemoryService {

    private static final int MAX_MESSAGES = 10;
    private static final Duration TTL = Duration.ofHours(1);
    private static final String KEY_PREFIX = "ai:mem:";

    private final StringRedisTemplate redis;

    public List<Message> recent(Long userId) {
        List<String> raw = redis.opsForList().range(key(userId), 0, MAX_MESSAGES - 1);
        if (raw == null || raw.isEmpty()) return List.of();
        List<Message> result = new ArrayList<>(raw.size());
        for (String line : raw) {
            int sep = line.indexOf('|');
            if (sep > 0) {
                result.add(new Message(line.substring(0, sep), line.substring(sep + 1)));
            }
        }
        Collections.reverse(result); // stored newest-first; conversation order needs oldest-first
        return result;
    }

    public void append(Long userId, Message message) {
        String line = message.role() + "|" + message.content().replace('\n', ' ');
        String key = key(userId);
        redis.opsForList().leftPush(key, line);
        redis.opsForList().trim(key, 0, MAX_MESSAGES - 1);
        redis.expire(key, TTL);
    }

    public void clear(Long userId) {
        redis.delete(key(userId));
    }

    private String key(Long userId) {
        return KEY_PREFIX + userId;
    }
}
