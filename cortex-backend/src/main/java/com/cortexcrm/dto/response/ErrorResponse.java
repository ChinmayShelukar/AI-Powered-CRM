package com.cortexcrm.dto.response;

import java.time.OffsetDateTime;
import java.util.Map;

public record ErrorResponse(
        int status,
        String error,
        String path,
        OffsetDateTime timestamp,
        Map<String, String> fieldErrors
) {
    public static ErrorResponse of(int status, String error, String path) {
        return new ErrorResponse(status, error, path, OffsetDateTime.now(), null);
    }

    public static ErrorResponse withFieldErrors(int status, String error, String path, Map<String, String> fieldErrors) {
        return new ErrorResponse(status, error, path, OffsetDateTime.now(), fieldErrors);
    }
}
