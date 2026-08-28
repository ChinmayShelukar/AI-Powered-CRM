package com.cortexcrm.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ClaudeClient {

    private static final Logger log = LoggerFactory.getLogger(ClaudeClient.class);

    private final ClaudeProperties props;
    private RestClient client;

    private RestClient http() {
        if (client == null) {
            client = RestClient.builder()
                    .baseUrl(props.baseUrl() != null ? props.baseUrl() : "https://api.anthropic.com")
                    .defaultHeader("x-api-key", props.key())
                    .defaultHeader("anthropic-version", "2023-06-01")
                    .defaultHeader("content-type", MediaType.APPLICATION_JSON_VALUE)
                    .build();
        }
        return client;
    }

    public String complete(String systemPrompt, List<Message> messages, int maxTokens) {
        if (props.key() == null || props.key().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Claude API key not configured (set CLAUDE_API_KEY env var)");
        }

        Map<String, Object> body = Map.of(
                "model", props.model(),
                "max_tokens", maxTokens,
                "system", systemPrompt,
                "messages", messages.stream().map(m -> Map.of("role", m.role(), "content", m.content())).toList()
        );

        long start = System.currentTimeMillis();
        try {
            ClaudeResponse response = http().post()
                    .uri("/v1/messages")
                    .body(body)
                    .retrieve()
                    .body(ClaudeResponse.class);

            long elapsed = System.currentTimeMillis() - start;
            if (response == null || response.content == null || response.content.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty response from Claude");
            }
            String text = response.content.get(0).text;
            if (response.usage != null) {
                log.info("[CLAUDE] {}ms in={} out={} cached={}",
                        elapsed, response.usage.input_tokens, response.usage.output_tokens,
                        response.usage.cache_read_input_tokens);
            }
            return text;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Claude API call failed", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Claude API error: " + e.getMessage());
        }
    }

    public record Message(String role, String content) {
        public static Message user(String text) { return new Message("user", text); }
        public static Message assistant(String text) { return new Message("assistant", text); }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ClaudeResponse {
        public List<ContentBlock> content;
        public Usage usage;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ContentBlock {
        public String type;
        public String text;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Usage {
        public int input_tokens;
        public int output_tokens;
        public Integer cache_read_input_tokens;
    }
}
