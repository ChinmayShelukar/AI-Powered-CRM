package com.cortexcrm.controller;

import com.cortexcrm.dto.request.ActivityRequest;
import com.cortexcrm.dto.response.ActivityResponse;
import com.cortexcrm.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<ActivityResponse> list(
            @RequestParam(required = false) Long contactId,
            @RequestParam(required = false) Long dealId) {
        return activityService.list(contactId, dealId);
    }

    @PostMapping
    public ActivityResponse create(@Valid @RequestBody ActivityRequest req) {
        return activityService.create(req);
    }

    @PutMapping("/{id}")
    public ActivityResponse update(@PathVariable Long id, @Valid @RequestBody ActivityRequest req) {
        return activityService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        activityService.delete(id);
    }
}
