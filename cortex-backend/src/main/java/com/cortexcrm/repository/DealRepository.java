package com.cortexcrm.repository;

import com.cortexcrm.entity.Deal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DealRepository extends JpaRepository<Deal, Long> {

    @Override
    @Query("SELECT d FROM Deal d LEFT JOIN FETCH d.contact LEFT JOIN FETCH d.assignedTo")
    List<Deal> findAll();

    @Override
    @EntityGraph(attributePaths = {"contact", "assignedTo"})
    Page<Deal> findAll(Pageable pageable);

    @Override
    @Query("SELECT d FROM Deal d LEFT JOIN FETCH d.contact LEFT JOIN FETCH d.assignedTo WHERE d.id = :id")
    Optional<Deal> findById(@Param("id") Long id);

    @Query("SELECT d FROM Deal d LEFT JOIN FETCH d.contact LEFT JOIN FETCH d.assignedTo WHERE d.assignedTo.id = :userId")
    List<Deal> findByAssignedToId(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"contact", "assignedTo"})
    @Query("SELECT d FROM Deal d WHERE d.assignedTo.id = :userId")
    Page<Deal> findPageByAssignedToId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT d FROM Deal d LEFT JOIN FETCH d.contact LEFT JOIN FETCH d.assignedTo WHERE d.contact.id = :contactId")
    List<Deal> findByContactId(@Param("contactId") Long contactId);
}
