package com.cortexcrm.ai;

import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * Defensive whitelist check on AI-generated SQL.
 * Only single SELECT statements against known CRM tables are allowed.
 */
@Component
public class SqlGuard {

    private static final Set<String> FORBIDDEN = Set.of(
            "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "GRANT",
            "REVOKE", "TRUNCATE", "EXEC", "EXECUTE", "CALL", "MERGE", "COPY",
            "VACUUM", "ANALYZE", "REINDEX", "SET", "RESET", "BEGIN", "COMMIT",
            "ROLLBACK", "SAVEPOINT"
    );

    private static final Set<String> ALLOWED_TABLES = Set.of(
            "users", "contacts", "deals", "activities"
    );

    // Matches the table name (or alias expression) immediately after FROM or JOIN.
    // Captures schema.table or plain table — schema-qualified refs are rejected below.
    private static final Pattern TABLE_REF = Pattern.compile(
            "(?:FROM|JOIN)\\s+([\\w.]+)",
            Pattern.CASE_INSENSITIVE
    );

    public String validate(String sql) {
        if (sql == null || sql.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Empty SQL");
        }

        String cleaned = sql.trim();
        // strip code fences if Claude wrapped output
        if (cleaned.startsWith("```")) {
            int firstNewline = cleaned.indexOf('\n');
            if (firstNewline > 0) cleaned = cleaned.substring(firstNewline + 1);
            if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length() - 3);
            cleaned = cleaned.trim();
        }

        // single statement only
        if (cleaned.contains(";")) {
            throw new ResponseStatusException(BAD_REQUEST, "Multiple statements not allowed");
        }

        String upper = cleaned.toUpperCase();
        if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
            throw new ResponseStatusException(BAD_REQUEST, "Only SELECT queries allowed");
        }

        // Strip string literals before keyword check so 'DELETE' in audit action filters
        // doesn't trigger a false positive on the DELETE forbidden keyword.
        String strippedUpper = upper.replaceAll("'[^']*'", "''");
        for (String word : FORBIDDEN) {
            if (strippedUpper.matches(".*\\b" + word + "\\b.*")) {
                throw new ResponseStatusException(BAD_REQUEST, "Forbidden keyword: " + word);
            }
        }

        // Whitelist every table referenced after FROM / JOIN — catches CTEs, subqueries,
        // and schema-qualified references like information_schema.tables or pg_catalog.pg_user.
        Matcher m = TABLE_REF.matcher(cleaned);
        while (m.find()) {
            String ref = m.group(1).toLowerCase();
            if (ref.contains(".")) {
                throw new ResponseStatusException(BAD_REQUEST,
                        "Schema-qualified table references are not allowed");
            }
            if (!ALLOWED_TABLES.contains(ref)) {
                throw new ResponseStatusException(BAD_REQUEST,
                        "Table '" + ref + "' is not accessible");
            }
        }

        return cleaned;
    }
}
