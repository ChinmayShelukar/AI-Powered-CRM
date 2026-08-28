package com.cortexcrm.sse.events;

import com.cortexcrm.entity.DealStage;

public record DealStageChangedEvent(
        Long dealId,
        String dealTitle,
        DealStage fromStage,
        DealStage toStage,
        Long recipientUserId
) {}
