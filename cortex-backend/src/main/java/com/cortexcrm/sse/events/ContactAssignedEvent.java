package com.cortexcrm.sse.events;

public record ContactAssignedEvent(
        Long contactId,
        String contactName,
        Long recipientUserId
) {}
