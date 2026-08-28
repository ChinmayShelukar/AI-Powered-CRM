package com.cortexcrm.service;

import com.cortexcrm.dto.request.DealRequest;
import com.cortexcrm.dto.response.DealResponse;
import com.cortexcrm.entity.Contact;
import com.cortexcrm.entity.Deal;
import com.cortexcrm.entity.DealStage;
import com.cortexcrm.entity.User;
import com.cortexcrm.repository.ContactRepository;
import com.cortexcrm.repository.DealRepository;
import com.cortexcrm.repository.UserRepository;
import com.cortexcrm.security.CurrentUserService;
import com.cortexcrm.sse.events.DealStageChangedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.math.BigDecimal;
import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
public class DealService {

    private final DealRepository dealRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUser;
    private final ApplicationEventPublisher events;

    @Transactional(readOnly = true)
    public List<DealResponse> list() {
        User me = currentUser.get();
        List<Deal> deals = currentUser.isAdminOrManager()
                ? dealRepository.findAll()
                : dealRepository.findByAssignedToId(me.getId());
        return deals.stream().map(DealResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public DealResponse get(Long id) {
        Deal d = loadAndAuthorize(id);
        return DealResponse.from(d);
    }

    public DealResponse create(DealRequest req) {
        User me = currentUser.get();
        Contact contact = req.contactId() == null ? null : contactRepository.findById(req.contactId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Contact not found"));
        User assignee = resolveAssignee(req.assignedToUserId(), me);

        Deal d = Deal.builder()
                .title(req.title())
                .value(req.value() != null ? req.value() : BigDecimal.ZERO)
                .stage(req.stage() != null ? req.stage() : DealStage.PROSPECT)
                .closeDate(req.closeDate())
                .contact(contact)
                .assignedTo(assignee)
                .build();

        return DealResponse.from(dealRepository.save(d));
    }

    public DealResponse update(Long id, DealRequest req) {
        Deal d = loadAndAuthorize(id);

        d.setTitle(req.title());
        if (req.value() != null) d.setValue(req.value());
        if (req.stage() != null) d.setStage(req.stage());
        d.setCloseDate(req.closeDate());

        if (req.contactId() != null) {
            Contact contact = contactRepository.findById(req.contactId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Contact not found"));
            d.setContact(contact);
        }

        if (currentUser.isAdminOrManager()) {
            d.setAssignedTo(resolveAssignee(req.assignedToUserId(), currentUser.get()));
        }

        return DealResponse.from(d);
    }

    public DealResponse updateStage(Long id, DealStage stage) {
        Deal d = loadAndAuthorize(id);
        DealStage previous = d.getStage();
        d.setStage(stage);

        if (d.getAssignedTo() != null && previous != stage) {
            events.publishEvent(new DealStageChangedEvent(
                    d.getId(), d.getTitle(), previous, stage, d.getAssignedTo().getId()));
        }
        return DealResponse.from(d);
    }

    public void delete(Long id) {
        if (!dealRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Deal not found");
        }
        dealRepository.deleteById(id);
    }

    private Deal loadAndAuthorize(Long id) {
        Deal d = dealRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Deal not found"));
        currentUser.requireAccessTo(d.getAssignedTo() != null ? d.getAssignedTo().getId() : null, "deal");
        return d;
    }

    private User resolveAssignee(Long requestedId, User me) {
        if (requestedId == null) return me;
        return userRepository.findById(requestedId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Assignee user not found"));
    }
}
