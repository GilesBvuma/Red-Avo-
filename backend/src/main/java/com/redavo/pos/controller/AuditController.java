package com.redavo.pos.controller;

import com.redavo.pos.model.AuditLog;
import com.redavo.pos.repository.AuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Read-only audit trail endpoints — ADMIN only.
 * Secured at the HTTP level in {@code SecurityConfig} as well as
 * here via {@code @PreAuthorize}.
 */
@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final AuditLogRepository auditLogRepo;

    public AuditController(AuditLogRepository auditLogRepo) {
        this.auditLogRepo = auditLogRepo;
    }

    /** Last 200 audit events across all entities, newest first. */
    @GetMapping
    public ResponseEntity<List<AuditLog>> getRecent() {
        return ResponseEntity.ok(auditLogRepo.findTop200ByOrderByOccurredAtDesc());
    }

    /** Full history for a specific entity (e.g. entity=Product, id=42). */
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<List<AuditLog>> getEntityHistory(
            @PathVariable String entityType,
            @PathVariable String entityId) {
        return ResponseEntity.ok(
                auditLogRepo.findByEntityTypeAndEntityIdOrderByOccurredAtDesc(
                        entityType, entityId));
    }

    /** All actions by a specific user. */
    @GetMapping("/actor/{actor}")
    public ResponseEntity<List<AuditLog>> getByActor(
            @PathVariable String actor) {
        return ResponseEntity.ok(
                auditLogRepo.findByActorOrderByOccurredAtDesc(actor));
    }
}
