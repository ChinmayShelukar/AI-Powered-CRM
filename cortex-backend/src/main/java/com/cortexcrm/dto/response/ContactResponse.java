package com.cortexcrm.dto.response;

import com.cortexcrm.entity.Contact;
import com.cortexcrm.entity.ContactStatus;

import java.time.OffsetDateTime;

public record ContactResponse(
        Long id,
        String name,
        String email,
        String phone,
        String company,
        ContactStatus status,
        Long assignedToUserId,
        String assignedToUserName,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ContactResponse from(Contact c) {
        return new ContactResponse(
                c.getId(),
                c.getName(),
                c.getEmail(),
                c.getPhone(),
                c.getCompany(),
                c.getStatus(),
                c.getAssignedTo() != null ? c.getAssignedTo().getId() : null,
                c.getAssignedTo() != null ? c.getAssignedTo().getName() : null,
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
