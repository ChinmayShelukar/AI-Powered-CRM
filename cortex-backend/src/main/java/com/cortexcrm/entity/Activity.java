package com.cortexcrm.entity;

import com.cortexcrm.audit.AuditEntityListener;
import com.cortexcrm.audit.Auditable;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(name = "activities")
@EntityListeners(AuditEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ActivityType type;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "activity_date", nullable = false)
    private OffsetDateTime activityDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Sentiment sentiment;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Intent intent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id")
    private Deal deal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (activityDate == null) activityDate = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    @Override
    public Map<String, Object> auditSnapshot() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("type", type != null ? type.name() : null);
        m.put("notes", notes);
        m.put("activityDate", activityDate);
        m.put("sentiment", sentiment != null ? sentiment.name() : null);
        m.put("intent", intent != null ? intent.name() : null);
        m.put("contactId", contact != null ? contact.getId() : null);
        m.put("dealId", deal != null ? deal.getId() : null);
        m.put("createdById", createdBy != null ? createdBy.getId() : null);
        return m;
    }
}
