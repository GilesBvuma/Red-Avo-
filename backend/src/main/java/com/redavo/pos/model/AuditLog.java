package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Immutable audit record written automatically by {@code AuditAspect} on every
 * create, update, and delete operation on tracked entities.
 * <p>
 * Rows are never updated or deleted — they are the permanent trail.
 */
@Entity
@Table(name = "audit_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Username from the JWT token, or {@code "system"} for seeder/scheduled tasks. */
    @Column(nullable = false, length = 100)
    private String actor;

    /** Role at time of action. */
    @Column(length = 20)
    private String role;

    /** Store context from JWT claim. Null for ADMIN. */
    @Column(name = "store_id")
    private Long storeId;

    /** Simple class name of the affected entity, e.g. {@code "Product"}. */
    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    /** Stringified primary key of the affected entity. */
    @Column(name = "entity_id", nullable = false, length = 100)
    private String entityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AuditAction action;

    /** JSON snapshot of the entity state before the change. Null for CREATE. */
    @Column(name = "before_json", columnDefinition = "TEXT")
    private String beforeJson;

    /** JSON snapshot of the entity state after the change. Null for DELETE. */
    @Column(name = "after_json", columnDefinition = "TEXT")
    private String afterJson;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;

    @PrePersist
    public void onPersist() {
        this.occurredAt = LocalDateTime.now();
    }
}
