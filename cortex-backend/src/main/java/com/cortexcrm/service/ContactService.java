package com.cortexcrm.service;

import com.cortexcrm.dto.request.ContactRequest;
import com.cortexcrm.dto.response.ContactResponse;
import com.cortexcrm.entity.Contact;
import com.cortexcrm.entity.ContactStatus;
import com.cortexcrm.entity.User;
import com.cortexcrm.repository.ContactRepository;
import com.cortexcrm.repository.UserRepository;
import com.cortexcrm.security.CurrentUserService;
import com.cortexcrm.sse.events.ContactAssignedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUser;
    private final ApplicationEventPublisher events;

    @Transactional(readOnly = true)
    public List<ContactResponse> list() {
        User me = currentUser.get();
        List<Contact> contacts = currentUser.isAdminOrManager()
                ? contactRepository.findAll()
                : contactRepository.findByAssignedToId(me.getId());
        return contacts.stream().map(ContactResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ContactResponse get(Long id) {
        Contact c = contactRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Contact not found"));
        currentUser.requireAccessTo(ownerIdOf(c), "contact");
        return ContactResponse.from(c);
    }

    public ContactResponse create(ContactRequest req) {
        User me = currentUser.get();
        User assignee = resolveAssignee(req.assignedToUserId(), me);

        Contact c = Contact.builder()
                .name(req.name())
                .email(req.email())
                .phone(req.phone())
                .company(req.company())
                .status(req.status() != null ? req.status() : ContactStatus.NEW)
                .assignedTo(assignee)
                .build();

        Contact saved = contactRepository.save(c);
        if (assignee != null && !assignee.getId().equals(me.getId())) {
            events.publishEvent(new ContactAssignedEvent(saved.getId(), saved.getName(), assignee.getId()));
        }
        return ContactResponse.from(saved);
    }

    public ContactResponse update(Long id, ContactRequest req) {
        Contact c = contactRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Contact not found"));
        currentUser.requireAccessTo(ownerIdOf(c), "contact");

        Long previousAssigneeId = c.getAssignedTo() != null ? c.getAssignedTo().getId() : null;

        c.setName(req.name());
        c.setEmail(req.email());
        c.setPhone(req.phone());
        c.setCompany(req.company());
        if (req.status() != null) c.setStatus(req.status());

        if (currentUser.isAdminOrManager()) {
            c.setAssignedTo(resolveAssignee(req.assignedToUserId(), currentUser.get()));
        }

        Long newAssigneeId = c.getAssignedTo() != null ? c.getAssignedTo().getId() : null;
        if (newAssigneeId != null && !newAssigneeId.equals(previousAssigneeId)
                && !newAssigneeId.equals(currentUser.get().getId())) {
            events.publishEvent(new ContactAssignedEvent(c.getId(), c.getName(), newAssigneeId));
        }

        return ContactResponse.from(c);
    }

    public void delete(Long id) {
        if (!contactRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Contact not found");
        }
        contactRepository.deleteById(id);
    }

    private User resolveAssignee(Long requestedId, User me) {
        if (requestedId == null) return me;
        return userRepository.findById(requestedId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Assignee user not found"));
    }

    private Long ownerIdOf(Contact c) {
        return c.getAssignedTo() != null ? c.getAssignedTo().getId() : null;
    }
}
