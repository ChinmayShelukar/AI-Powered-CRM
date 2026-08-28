package com.cortexcrm.dto.response;

import java.util.List;
import java.util.Map;

public record AiQueryResponse(
        String question,
        String sql,
        List<Map<String, Object>> rows,
        int rowCount,
        String chatResponse
) {}
