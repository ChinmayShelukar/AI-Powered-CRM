package com.cortexcrm.service;

import com.cortexcrm.dto.request.UpdateRoleRequest;
import com.cortexcrm.dto.response.UserResponse;
import com.cortexcrm.entity.User;
import com.cortexcrm.repository.UserRepository;
import com.cortexcrm.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final CurrentUserService currentUser;

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getId))
                .map(UserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    }

    public UserResponse updateRole(Long id, UpdateRoleRequest req) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        if (target.getId().equals(currentUser.get().getId())) {
            throw new ResponseStatusException(BAD_REQUEST, "You cannot change your own role");
        }

        target.setRole(req.role());
        return UserResponse.from(userRepository.save(target));
    }
}
