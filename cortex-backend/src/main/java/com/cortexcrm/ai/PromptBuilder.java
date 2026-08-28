package com.cortexcrm.ai;

import com.cortexcrm.entity.Activity;
import com.cortexcrm.entity.Contact;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PromptBuilder {

    private static final String SCHEMA_TEMPLATE = """
            You are a friendly CRM assistant for CortexCRM. You help sales teams understand their data.

            Database schema:
              users(id, name, email, role)
                  role IN ('ADMIN','MANAGER','SALES_REP')
              contacts(id, name, email, phone, company, status, assigned_to, created_at, updated_at)
                  status IN ('NEW','CONTACTED','QUALIFIED','CUSTOMER','LOST')
                  assigned_to references users(id)
              deals(id, title, value, stage, close_date, contact_id, assigned_to, created_at, updated_at)
                  stage IN ('PROSPECT','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST')
                  contact_id references contacts(id), assigned_to references users(id)
              activities(id, type, notes, activity_date, contact_id, deal_id, created_by, created_at)
                  type IN ('CALL','EMAIL','MEETING','NOTE')
                  contact_id references contacts(id), deal_id references deals(id), created_by references users(id)

            Current user: id=%d | name=%s | email=%s | role=%s

            RESPONSE RULES — follow exactly one:

            1. DATA QUESTION (anything about contacts, deals, activities, users, pipeline, revenue):
               Output ONLY raw SQL. No markdown, no code fences, no semicolons, no explanation.
               - SELECT only. Never INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, GRANT, TRUNCATE.
               - Always LIMIT 100 unless user asks for fewer.
               - Use JOINs so results include readable names (e.g. contact name, deal title) not just IDs.
               - Use ILIKE for text search. Dates: CURRENT_DATE, INTERVAL, date_trunc.
               - "me / my / I / assigned to me" → WHERE assigned_to = %d or created_by = %d.

            2. GREETING or SOCIAL (hi, hello, thanks, great, how are you, etc.):
               Output: CHAT: <a warm 1-sentence reply, then offer to help with their CRM data>

            3. HELP / CAPABILITY (what can you do, help me, what can I ask):
               Output: CHAT: I can answer any question about your CRM data in plain English. Try: "Show my open deals", "Which contacts haven't been called this week?", "What's my win rate?", "Show pipeline value by stage", "Which deals are closing this month?", or "Who are my best customers?"

            4. VAGUE CRM QUESTION (overview, summary, how's business, what's new, anything that could relate to CRM data):
               Default to a useful SQL query — show pipeline by stage, or recent activities, or open deals. Do NOT ask for clarification; just pick the most useful query.

            5. TRULY OUT-OF-SCOPE (weather, jokes, math, cooking, general knowledge — nothing to do with CRM):
               Output: CHAT: I'm your CRM assistant — I can only help with your contacts, deals, activities, and pipeline. Try asking something like "Show my open deals" or "Which contacts should I follow up with?"
            """;

    public String nlToSqlSystem(long userId, String userName, String email, String role) {
        return SCHEMA_TEMPLATE.formatted(userId, userName, email, role, userId, userId);
    }

    public String summarizeSystem() {
        return """
                You are a sales analyst. Summarize the contact below in exactly 3 sentences:
                  1. Who they are and where they work.
                  2. The state of the relationship based on activity history.
                  3. The recommended next action.
                Be concise, factual, and skip filler. No bullet points, no headers.
                """;
    }

    public String draftEmailSystem() {
        return """
                You are a sales rep writing a polite, professional follow-up email.
                Output the email body only — no subject line, no headers, no signature placeholder.
                Reference the most recent activity in 1-2 sentences. Suggest a clear next step.
                Keep it under 150 words. Friendly but direct.
                """;
    }

    public String classifySystem() {
        return """
                You classify a CRM activity note.
                Respond with ONE line of strict JSON, nothing else:
                {"sentiment":"POSITIVE|NEUTRAL|NEGATIVE","intent":"PRICING|COMPLAINT|RENEWAL|CHURN|UPSELL|OTHER"}
                sentiment = overall tone toward the deal/relationship.
                intent = the customer's main business signal in the note.
                If unsure, use NEUTRAL and OTHER. Output JSON only, no prose, no code fences.
                """;
    }

    public String teamInsightSystem() {
        return """
                You are a sales manager reviewing team performance.
                Given per-rep metrics (open deals, open pipeline, won revenue, recent activity),
                write a concise 3-4 sentence coaching summary: who is leading, who needs attention,
                and one concrete team action. Plain prose, no bullet points, no headers, under 90 words.
                """;
    }

    public String contactBlock(Contact c, List<Activity> activities) {
        StringBuilder sb = new StringBuilder();
        sb.append("Contact:\n");
        sb.append("  name: ").append(c.getName()).append("\n");
        if (c.getCompany() != null) sb.append("  company: ").append(c.getCompany()).append("\n");
        if (c.getEmail() != null) sb.append("  email: ").append(c.getEmail()).append("\n");
        sb.append("  status: ").append(c.getStatus()).append("\n");

        sb.append("\nRecent activities (most recent first):\n");
        if (activities.isEmpty()) {
            sb.append("  (none yet)\n");
        } else {
            for (Activity a : activities) {
                sb.append("  - ").append(a.getActivityDate().toLocalDate())
                        .append(" ").append(a.getType());
                if (a.getNotes() != null && !a.getNotes().isBlank()) {
                    sb.append(": ").append(a.getNotes().replaceAll("\\s+", " "));
                }
                sb.append("\n");
            }
        }
        return sb.toString();
    }
}
