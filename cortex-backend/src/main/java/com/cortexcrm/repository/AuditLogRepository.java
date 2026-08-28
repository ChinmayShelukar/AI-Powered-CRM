package com.cortexcrm.repository;

import com.cortexcrm.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Override
    @EntityGraph(attributePaths = {"user"})
    Page<AuditLog> findAll(Pageable pageable);

    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.user " +
           "WHERE a.entityType = :entityType AND a.entityId = :entityId " +
           "ORDER BY a.occurredAt DESC")
    List<AuditLog> findByEntityTypeAndEntityIdOrderByOccurredAtDesc(
            @Param("entityType") String entityType,
            @Param("entityId") Long entityId);
}
