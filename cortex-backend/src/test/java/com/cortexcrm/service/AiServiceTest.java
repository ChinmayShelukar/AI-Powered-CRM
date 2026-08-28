package com.cortexcrm.service;

import com.cortexcrm.ai.AiMemoryService;
import com.cortexcrm.ai.ClaudeClient;
import com.cortexcrm.ai.PromptBuilder;
import com.cortexcrm.ai.SqlGuard;
import com.cortexcrm.dto.response.AiQueryResponse;
import com.cortexcrm.entity.Contact;
import com.cortexcrm.entity.Role;
import com.cortexcrm.entity.User;
import com.cortexcrm.repository.ActivityRepository;
import com.cortexcrm.repository.ContactRepository;
import com.cortexcrm.security.CurrentUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/** AiService with a mocked ClaudeClient — no network. Verifies SQL path, chat path, summary trim. */
@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock ClaudeClient claude;
    @Mock PromptBuilder prompts;
    @Mock SqlGuard sqlGuard;
    @Mock AiMemoryService memory;
    @Mock ContactRepository contactRepository;
    @Mock ActivityRepository activityRepository;
    @Mock JdbcTemplate jdbc;
    @Mock CurrentUserService currentUser;
    @InjectMocks AiService aiService;

    private User user() {
        return User.builder().id(1L).name("Ada").email("ada@x.com").role(Role.SALES_REP).build();
    }

    @Test
    void nlQuery_sqlPath_runsValidatedSqlAndReturnsRows() {
        when(currentUser.get()).thenReturn(user());
        when(prompts.nlToSqlSystem(anyLong(), any(), any(), any())).thenReturn("sys");
        when(memory.recent(1L)).thenReturn(List.of());
        when(claude.complete(any(), anyList(), anyInt())).thenReturn("SELECT id FROM contacts");
        when(sqlGuard.validate("SELECT id FROM contacts")).thenReturn("SELECT id FROM contacts");
        when(jdbc.queryForList("SELECT id FROM contacts"))
                .thenReturn(List.of(Map.of("id", 1), Map.of("id", 2)));

        AiQueryResponse r = aiService.nlQuery("show contacts");

        assertEquals("SELECT id FROM contacts", r.sql());
        assertEquals(2, r.rowCount());
        assertNull(r.chatResponse());
    }

    @Test
    void nlQuery_chatPath_returnsConversationalReply() {
        when(currentUser.get()).thenReturn(user());
        when(prompts.nlToSqlSystem(anyLong(), any(), any(), any())).thenReturn("sys");
        when(memory.recent(1L)).thenReturn(List.of());
        when(claude.complete(any(), anyList(), anyInt())).thenReturn("CHAT: Hello there!");

        AiQueryResponse r = aiService.nlQuery("hi");

        assertEquals("Hello there!", r.chatResponse());
        assertNull(r.sql());
    }

    @Test
    void summarizeContact_trimsClaudeOutput() {
        Contact c = Contact.builder().id(5L).name("Acme").build();
        when(contactRepository.findById(5L)).thenReturn(Optional.of(c));
        when(activityRepository.findByContactIdOrderByActivityDateDesc(5L)).thenReturn(List.of());
        when(prompts.summarizeSystem()).thenReturn("sys");
        when(prompts.contactBlock(eq(c), anyList())).thenReturn("block");
        when(claude.complete(any(), anyList(), anyInt())).thenReturn("  A summary.  ");

        assertEquals("A summary.", aiService.summarizeContact(5L));
    }
}
