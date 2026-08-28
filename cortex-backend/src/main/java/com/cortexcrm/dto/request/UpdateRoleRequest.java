package com.cortexcrm.dto.request;

import com.cortexcrm.entity.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
        @NotNull Role role
) {
}
