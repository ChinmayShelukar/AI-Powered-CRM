package com.cortexcrm.controller;

import com.cortexcrm.dto.request.DealRequest;
import com.cortexcrm.dto.request.StageUpdateRequest;
import com.cortexcrm.dto.response.DealResponse;
import com.cortexcrm.service.DealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deals")
@RequiredArgsConstructor
public class DealController {

    private final DealService dealService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<DealResponse> list() {
        return dealService.list();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public DealResponse get(@PathVariable Long id) {
        return dealService.get(id);
    }

    @PostMapping
    public DealResponse create(@Valid @RequestBody DealRequest req) {
        return dealService.create(req);
    }

    @PutMapping("/{id}")
    public DealResponse update(@PathVariable Long id, @Valid @RequestBody DealRequest req) {
        return dealService.update(id, req);
    }

    @PutMapping("/{id}/stage")
    public DealResponse updateStage(@PathVariable Long id, @Valid @RequestBody StageUpdateRequest req) {
        return dealService.updateStage(id, req.stage());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        dealService.delete(id);
    }
}
