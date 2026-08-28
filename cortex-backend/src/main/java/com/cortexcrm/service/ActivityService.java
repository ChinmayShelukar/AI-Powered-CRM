package com.cortexcrm.service;

import com.cortexcrm.dto.request.ActivityRequest;
import com.cortexcrm.dto.response.ActivityResponse;
import com.cortexcrm.entity.Activity;
import com.cortexcrm.entity.Contact;
import com.cortexcrm.entity.Deal;
import com.cortexcrm.entity.User;
import com.cortexcrm.repository.ActivityRepository;
import com.cortexcrm.repository.ContactRepository;
import com.cortexcrm.repository.DealRepository;
import com.cortexcrm.security.CurrentUserService;
import com.cortexcrm.sse.events.ActivityLoggedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;
    private final CurrentUserService currentUser;
    private final ApplicationEventPublisher events;
    private final InsightService insightService;

    @Transactional(readOnly = true)
    public List<ActivityResponse> list(Long contactId, Long dealId) {
        List<Activity> activities;
        if (contactId != null) {
            activities = activityRepository.findByContactIdOrderByActivityDateDesc(contactId);
        } else if (dealId != null) {
            activities = activityRepository.findByDealIdOrderByActivityDateDesc(dealId);
        } else if (currentUser.isAdminOrManager()) {
            activities = activityRepository.findAll();
        } else {
            activities = activityRepository.findByCreatedByIdOrderByActivityDateDesc(currentUser.get().getId());
        }
        return activities.stream().map(ActivityResponse::from).toList();
    }

    public ActivityResponse update(Long id, ActivityRequest req) {
        if (req.contactId() == null && req.dealId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Activity must be linked to a contact or deal");
        }

        Activity a = activityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Activity not found"));

        // Creator can edit; ADMIN/MANAGER can edit anyone's.
        currentUser.requireAccessTo(a.getCreatedBy() != null ? a.getCreatedBy().getId() : null, "activity");

        Contact contact = req.contactId() == null ? null : contactRepository.findById(req.contactId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Contact not found"));
        Deal deal = req.dealId() == null ? null : dealRepository.findById(req.dealId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Deal not found"));

        a.setType(req.type());
        a.setNotes(req.notes());
        if (req.activityDate() != null) {
            a.setActivityDate(req.activityDate());
        }
        a.setContact(contact);
        a.setDeal(deal);

        return ActivityResponse.from(activityRepository.save(a));
    }

    public void delete(Long id) {
        Activity a = activityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Activity not found"));
        activityRepository.delete(a);
    }

    public ActivityResponse create(ActivityRequest req) {
        if (req.contactId() == null && req.dealId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Activity must be linked to a contact or deal");
        }

        User me = currentUser.get();

        Contact contact = req.contactId() == null ? null : contactRepository.findById(req.contactId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Contact not found"));
        Deal deal = req.dealId() == null ? null : dealRepository.findById(req.dealId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Deal not found"));

        Activity a = Activity.builder()
                .type(req.type())
                .notes(req.notes())
                .activityDate(req.activityDate() != null ? req.activityDate() : OffsetDateTime.now())
                .contact(contact)
                .deal(deal)
                .createdBy(me)
                .build();

        // Auto-classify note sentiment/intent (LLM when key set, else keyword fallback; never throws).
        InsightService.Classification c = insightService.classify(req.notes());
        a.setSentiment(c.sentiment());
        a.setIntent(c.intent());

        Activity saved = activityRepository.save(a);

        Long recipient = null;
        if (deal != null && deal.getAssignedTo() != null) {
            recipient = deal.getAssignedTo().getId();
        } else if (contact != null && contact.getAssignedTo() != null) {
            recipient = contact.getAssignedTo().getId();
        }
        if (recipient != null && !recipient.equals(me.getId())) {
            events.publishEvent(new ActivityLoggedEvent(
                    saved.getId(), saved.getType(),
                    contact != null ? contact.getId() : null,
                    deal != null ? deal.getId() : null,
                    me.getId(), recipient));
        }

        return ActivityResponse.from(saved);
    }
}
