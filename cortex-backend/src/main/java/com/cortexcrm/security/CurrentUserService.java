package com.cortexcrm.security;

import com.cortexcrm.entity.Role;
import com.cortexcrm.entity.User;
import com.cortexcrm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;



@Component
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public User get() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    }

    public boolean isAdminOrManager() {
        Role role = get().getRole();
        return role == Role.ADMIN || role == Role.MANAGER;
    }

    /**
     * Allow access if the caller is ADMIN/MANAGER, or if they own the resource (ownerId == their id).
     * Throws 403 otherwise. Centralizes the row-level RBAC rule used across services.
     */
    public void requireAccessTo(Long ownerId, String entityName) {
        if (isAdminOrManager()) return;
        Long me = get().getId();
        if (ownerId == null || !ownerId.equals(me)) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Not authorized to access this " + entityName);
        }
    }
}
