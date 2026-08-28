package com.cortexcrm.sse.events;

import com.cortexcrm.entity.ActivityType;

public record ActivityLoggedEvent(
        Long activityId,
        ActivityType type,
        Long contactId,
        Long dealId,
        Long createdByUserId,
        Long recipientUserId
) {}
