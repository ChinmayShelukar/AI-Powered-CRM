package com.cortexcrm.dto.request;

import com.cortexcrm.entity.DealStage;
import jakarta.validation.constraints.NotNull;

public record StageUpdateRequest(@NotNull DealStage stage) {}
