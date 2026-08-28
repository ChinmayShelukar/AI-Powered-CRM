package com.cortexcrm.dto.response;

import com.cortexcrm.entity.Activity;
import com.cortexcrm.entity.ActivityType;
import com.cortexcrm.entity.Intent;
import com.cortexcrm.entity.Sentiment;

import java.time.OffsetDateTime;

public record ActivityResponse(
        Long id,
        ActivityType type,
        String notes,
        OffsetDateTime activityDate,
        Sentiment sentiment,
        Intent intent,
        Long contactId,
        String contactName,
        Long dealId,
        String dealTitle,
        Long createdByUserId,
        String createdByUserName,
        OffsetDateTime createdAt
) {
    public static ActivityResponse from(Activity a) {
        return new ActivityResponse(
                a.getId(),
                a.getType(),
                a.getNotes(),
                a.getActivityDate(),
                a.getSentiment(),
                a.getIntent(),
                a.getContact() != null ? a.getContact().getId() : null,
                a.getContact() != null ? a.getContact().getName() : null,
                a.getDeal() != null ? a.getDeal().getId() : null,
                a.getDeal() != null ? a.getDeal().getTitle() : null,
                a.getCreatedBy().getId(),
                a.getCreatedBy().getName(),
                a.getCreatedAt()
        );
    }
}
