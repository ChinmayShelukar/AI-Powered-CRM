package com.cortexcrm.service;

import com.cortexcrm.dto.request.LoginRequest;
import com.cortexcrm.dto.request.RegisterRequest;
import com.cortexcrm.dto.response.AuthResponse;
import com.cortexcrm.entity.Role;
import com.cortexcrm.entity.User;
import com.cortexcrm.repository.UserRepository;
import com.cortexcrm.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** AuthService register/login with mocked repo, encoder, jwt. */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtUtil jwtUtil;
    @InjectMocks AuthService authService;

    @Test
    void register_hashesPasswordAndSaves() {
        when(userRepository.existsByEmail("ada@x.com")).thenReturn(false);
        when(passwordEncoder.encode("password1")).thenReturn("HASHED");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0); u.setId(1L); return u;
        });
        when(jwtUtil.generateToken(any(User.class))).thenReturn("tok");

        AuthResponse r = authService.register(new RegisterRequest("Ada", "ada@x.com", "password1"));

        assertEquals("tok", r.token());
        assertEquals(Role.SALES_REP, r.role());
        verify(passwordEncoder).encode("password1");
        verify(userRepository).save(argThat(u -> "HASHED".equals(u.getPasswordHash())));
    }

    @Test
    void register_duplicateEmailConflicts() {
        when(userRepository.existsByEmail("dup@x.com")).thenReturn(true);
        assertThrows(ResponseStatusException.class,
                () -> authService.register(new RegisterRequest("Dup", "dup@x.com", "password1")));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_successReturnsToken() {
        User u = User.builder().id(2L).name("Bob").email("bob@x.com")
                .passwordHash("HASH").role(Role.MANAGER).build();
        when(userRepository.findByEmail("bob@x.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("pw", "HASH")).thenReturn(true);
        when(jwtUtil.generateToken(u)).thenReturn("tok2");

        AuthResponse r = authService.login(new LoginRequest("bob@x.com", "pw"));
        assertEquals("tok2", r.token());
        assertEquals(Role.MANAGER, r.role());
    }

    @Test
    void login_unknownEmailUnauthorized() {
        when(userRepository.findByEmail("no@x.com")).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class,
                () -> authService.login(new LoginRequest("no@x.com", "pw")));
    }

    @Test
    void login_wrongPasswordRejected() {
        User u = User.builder().id(3L).email("c@x.com").passwordHash("HASH").role(Role.SALES_REP).build();
        when(userRepository.findByEmail("c@x.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("bad", "HASH")).thenReturn(false);
        assertThrows(BadCredentialsException.class,
                () -> authService.login(new LoginRequest("c@x.com", "bad")));
    }
}
