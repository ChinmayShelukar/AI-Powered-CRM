package com.cortexcrm.ai;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** Security-critical: SqlGuard must allow only single read-only SELECTs on whitelisted tables. */
class SqlGuardTest {

    private final SqlGuard guard = new SqlGuard();

    @Test
    void allowsPlainSelectOnAllowedTable() {
        String sql = "SELECT id, name FROM contacts WHERE status = 'NEW'";
        assertEquals(sql, guard.validate(sql));
    }

    @Test
    void allowsJoinAcrossAllowedTables() {
        String sql = "SELECT d.title FROM deals d JOIN contacts c ON c.id = d.contact_id";
        assertEquals(sql, guard.validate(sql));
    }

    @Test
    void stripsCodeFences() {
        String fenced = "```sql\nSELECT id FROM users\n```";
        assertEquals("SELECT id FROM users", guard.validate(fenced));
    }

    @Test
    void rejectsInsertUpdateDeleteDrop() {
        for (String sql : new String[]{
                "INSERT INTO users(name) VALUES('x')",
                "UPDATE deals SET value = 0",
                "DELETE FROM contacts",
                "DROP TABLE users"}) {
            assertThrows(ResponseStatusException.class, () -> guard.validate(sql), sql);
        }
    }

    @Test
    void rejectsMultipleStatements() {
        assertThrows(ResponseStatusException.class,
                () -> guard.validate("SELECT 1 FROM users; DROP TABLE users"));
    }

    @Test
    void rejectsDisallowedTable() {
        assertThrows(ResponseStatusException.class,
                () -> guard.validate("SELECT * FROM audit_logs"));
    }

    @Test
    void rejectsSchemaQualifiedTable() {
        assertThrows(ResponseStatusException.class,
                () -> guard.validate("SELECT * FROM information_schema.tables"));
    }

    @Test
    void rejectsForbiddenKeywordEvenWithSelectPrefix() {
        assertThrows(ResponseStatusException.class,
                () -> guard.validate("SELECT * FROM contacts WHERE id IN (SELECT id FROM contacts); TRUNCATE contacts"));
    }

    @Test
    void allowsDeleteLiteralInsideStringWithoutTripping() {
        // 'DELETE' as a filter value must not trigger the forbidden-keyword scan.
        String sql = "SELECT id FROM activities WHERE notes = 'please DELETE later'";
        assertEquals(sql, guard.validate(sql));
    }

    @Test
    void rejectsEmpty() {
        assertThrows(ResponseStatusException.class, () -> guard.validate("  "));
    }
}
