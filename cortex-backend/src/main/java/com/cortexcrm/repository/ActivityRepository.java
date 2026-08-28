package com.cortexcrm.repository;

import com.cortexcrm.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    @Override
    @Query("SELECT a FROM Activity a LEFT JOIN FETCH a.contact LEFT JOIN FETCH a.deal LEFT JOIN FETCH a.createdBy")
    List<Activity> findAll();

    @Override
    @EntityGraph(attributePaths = {"contact", "deal", "createdBy"})
    Page<Activity> findAll(Pageable pageable);

    @Query("SELECT a FROM Activity a LEFT JOIN FETCH a.contact LEFT JOIN FETCH a.deal LEFT JOIN FETCH a.createdBy WHERE a.contact.id = :contactId ORDER BY a.activityDate DESC")
    List<Activity> findByContactIdOrderByActivityDateDesc(@Param("contactId") Long contactId);

    @Query("SELECT a FROM Activity a LEFT JOIN FETCH a.contact LEFT JOIN FETCH a.deal LEFT JOIN FETCH a.createdBy WHERE a.deal.id = :dealId ORDER BY a.activityDate DESC")
    List<Activity> findByDealIdOrderByActivityDateDesc(@Param("dealId") Long dealId);

    @Query("SELECT a FROM Activity a LEFT JOIN FETCH a.contact LEFT JOIN FETCH a.deal LEFT JOIN FETCH a.createdBy WHERE a.createdBy.id = :userId ORDER BY a.activityDate DESC")
    List<Activity> findByCreatedByIdOrderByActivityDateDesc(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"contact", "deal", "createdBy"})
    @Query("SELECT a FROM Activity a WHERE a.createdBy.id = :userId ORDER BY a.activityDate DESC")
    Page<Activity> findPageByCreatedByIdOrderByActivityDateDesc(@Param("userId") Long userId, Pageable pageable);
}
