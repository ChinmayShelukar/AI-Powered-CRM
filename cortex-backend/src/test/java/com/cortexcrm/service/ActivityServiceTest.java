package com.cortexcrm.service;

import com.cortexcrm.dto.request.ActivityRequest;
import com.cortexcrm.entity.Activity;
import com.cortexcrm.entity.ActivityType;
import com.cortexcrm.entity.Contact;
import com.cortexcrm.entity.Intent;
import com.cortexcrm.entity.Role;
import com.cortexcrm.entity.Sentiment;
import com.cortexcrm.entity.User;
import com.cortexcrm.repository.ActivityRepository;
import com.cortexcrm.repository.ContactRepository;
import com.cortexcrm.repository.DealRepository;
import com.cortexcrm.security.CurrentUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** ActivityService.create must classify the note (my feature) and persist sentiment/intent. */
@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock ActivityRepository activityRepository;
    @Mock ContactRepository contactRepository;
    @Mock DealRepository dealRepository;
    @Mock CurrentUserService currentUser;
    @Mock ApplicationEventPublisher events;
    @Mock InsightService insightService;
    @InjectMocks ActivityService activityService;

    @Test
    void create_classifiesNoteAndPersistsSentimentIntent() {
        User me = User.builder().id(1L).name("Rep").role(Role.SALES_REP).build();
        Contact contact = Contact.builder().id(3L).name("Acme").build();
        when(currentUser.get()).thenReturn(me);
        when(contactRepository.findById(3L)).thenReturn(Optional.of(contact));
        when(insightService.classify("angry customer"))
                .thenReturn(new InsightService.Classification(Sentiment.NEGATIVE, Intent.COMPLAINT));
        when(activityRepository.save(any(Activity.class))).thenAnswer(i -> i.getArgument(0));

        var req = new ActivityRequest(ActivityType.CALL, "angry customer", null, 3L, null);
        var resp = activityService.create(req);

        verify(insightService).classify("angry customer");
        assertEquals(Sentiment.NEGATIVE, resp.sentiment());
        assertEquals(Intent.COMPLAINT, resp.intent());
    }

    @Test
    void create_requiresContactOrDeal() {
        // create() rejects before touching currentUser, so no stub needed.
        var req = new ActivityRequest(ActivityType.NOTE, "note", null, null, null);
        assertThrows(ResponseStatusException.class, () -> activityService.create(req));
        verify(activityRepository, never()).save(any());
    }
}
