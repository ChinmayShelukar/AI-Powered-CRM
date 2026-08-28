package com.cortexcrm.dto.response;

import com.cortexcrm.entity.Role;

public record AuthResponse(
        String token,
        Long userId,
        String email,
        String name,
        Role role
) {}
