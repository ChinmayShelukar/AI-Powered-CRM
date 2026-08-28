package com.cortexcrm.repository;

import com.cortexcrm.entity.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, Long> {

    @Override
    @Query("SELECT c FROM Contact c LEFT JOIN FETCH c.assignedTo")
    List<Contact> findAll();

    @Override
    @EntityGraph(attributePaths = {"assignedTo"})
    Page<Contact> findAll(Pageable pageable);

    @Override
    @Query("SELECT c FROM Contact c LEFT JOIN FETCH c.assignedTo WHERE c.id = :id")
    Optional<Contact> findById(@Param("id") Long id);

    @Query("SELECT c FROM Contact c LEFT JOIN FETCH c.assignedTo WHERE c.assignedTo.id = :userId")
    List<Contact> findByAssignedToId(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"assignedTo"})
    @Query("SELECT c FROM Contact c WHERE c.assignedTo.id = :userId")
    Page<Contact> findPageByAssignedToId(@Param("userId") Long userId, Pageable pageable);
}
