package com.cortexcrm.dto.request;

import com.cortexcrm.entity.ContactStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactRequest(
        @NotBlank @Size(max = 120) String name,
        @Email @Size(max = 255) String email,
        @Size(max = 40) String phone,
        @Size(max = 160) String company,
        ContactStatus status,
        Long assignedToUserId
) {}
