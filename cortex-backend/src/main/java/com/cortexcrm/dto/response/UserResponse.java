package com.cortexcrm.dto.response;

import com.cortexcrm.entity.Role;
import com.cortexcrm.entity.User;

import java.time.OffsetDateTime;

public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        OffsetDateTime createdAt
) {
    public static UserResponse from(User u) {
        return new UserResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getRole(),
                u.getCreatedAt()
        );
    }
}
