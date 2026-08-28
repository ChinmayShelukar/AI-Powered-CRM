package com.cortexcrm.controller;

import com.cortexcrm.dto.request.ContactRequest;
import com.cortexcrm.dto.response.ContactResponse;
import com.cortexcrm.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<ContactResponse> list() {
        return contactService.list();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ContactResponse get(@PathVariable Long id) {
        return contactService.get(id);
    }

    @PostMapping
    public ContactResponse create(@Valid @RequestBody ContactRequest req) {
        return contactService.create(req);
    }

    @PutMapping("/{id}")
    public ContactResponse update(@PathVariable Long id, @Valid @RequestBody ContactRequest req) {
        return contactService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        contactService.delete(id);
    }
}
