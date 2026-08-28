package com.cortexcrm.security;

import com.cortexcrm.entity.Role;
import com.cortexcrm.entity.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** JWT generate/parse round-trip + tamper rejection. */
class JwtUtilTest {

    // 64 hex chars (>= 32 bytes) as required.
    private static final String SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    private JwtUtil util(long expirationMs) {
        return new JwtUtil(new JwtProperties(SECRET, expirationMs, "cortexcrm", "Authorization", "Bearer "));
    }

    private User user() {
        return User.builder().id(7L).name("Ada").email("ada@x.com").role(Role.SALES_REP).build();
    }

    @Test
    void generateThenParseRoundTrip() {
        JwtUtil util = util(3_600_000);
        String token = util.generateToken(user());
        assertEquals("ada@x.com", util.extractEmail(token));
        assertEquals("SALES_REP", util.parse(token).get("role", String.class));
    }

    @Test
    void tamperedTokenRejected() {
        JwtUtil util = util(3_600_000);
        String token = util.generateToken(user());
        String tampered = token.substring(0, token.length() - 2)
                + (token.endsWith("a") ? "bb" : "aa");
        assertThrows(Exception.class, () -> util.parse(tampered));
    }

    @Test
    void expiredTokenRejected() {
        JwtUtil util = util(-1_000); // already expired
        String token = util.generateToken(user());
        assertThrows(Exception.class, () -> util.parse(token));
    }

    @Test
    void differentSecretRejectsToken() {
        String token = util(3_600_000).generateToken(user());
        JwtUtil other = new JwtUtil(new JwtProperties(
                "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
                3_600_000, "cortexcrm", "Authorization", "Bearer "));
        assertThrows(Exception.class, () -> other.parse(token));
        assertNotEquals(token, other.generateToken(user()));
    }
}
