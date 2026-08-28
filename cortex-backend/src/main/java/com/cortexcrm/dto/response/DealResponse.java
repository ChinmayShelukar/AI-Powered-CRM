package com.cortexcrm.dto.response;

import com.cortexcrm.entity.Deal;
import com.cortexcrm.entity.DealStage;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record DealResponse(
        Long id,
        String title,
        BigDecimal value,
        DealStage stage,
        LocalDate closeDate,
        Long contactId,
        String contactName,
        Long assignedToUserId,
        String assignedToUserName,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static DealResponse from(Deal d) {
        return new DealResponse(
                d.getId(),
                d.getTitle(),
                d.getValue(),
                d.getStage(),
                d.getCloseDate(),
                d.getContact() != null ? d.getContact().getId() : null,
                d.getContact() != null ? d.getContact().getName() : null,
                d.getAssignedTo() != null ? d.getAssignedTo().getId() : null,
                d.getAssignedTo() != null ? d.getAssignedTo().getName() : null,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
