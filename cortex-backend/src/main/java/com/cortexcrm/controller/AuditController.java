package com.cortexcrm.controller;

import com.cortexcrm.dto.response.AuditLogResponse;
import com.cortexcrm.dto.response.PageResponse;
import com.cortexcrm.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Transactional(readOnly = true)
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public Object list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (entityType != null && entityId != null) {
            List<AuditLogResponse> rows = auditLogRepository
                    .findByEntityTypeAndEntityIdOrderByOccurredAtDesc(entityType, entityId)
                    .stream().map(AuditLogResponse::from).toList();
            return rows;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "occurredAt"));
        return PageResponse.from(
                auditLogRepository.findAll(pageable).map(AuditLogResponse::from)
        );
    }
}
