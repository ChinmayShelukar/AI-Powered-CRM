package com.cortexcrm.dto.request;

import com.cortexcrm.entity.ActivityType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public record ActivityRequest(
        @NotNull ActivityType type,
        @Size(max = 5000) String notes,
        OffsetDateTime activityDate,
        Long contactId,
        Long dealId
) {}
