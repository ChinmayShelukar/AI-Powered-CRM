package com.cortexcrm.dto.request;

import com.cortexcrm.entity.DealStage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DealRequest(
        @NotBlank @Size(max = 200) String title,
        @PositiveOrZero BigDecimal value,
        DealStage stage,
        LocalDate closeDate,
        Long contactId,
        Long assignedToUserId
) {}
