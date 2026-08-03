package com.redavo.pos.repository;

import com.redavo.pos.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityTypeAndEntityIdOrderByOccurredAtDesc(
            String entityType, String entityId);
    List<AuditLog> findByActorOrderByOccurredAtDesc(String actor);
    List<AuditLog> findTop200ByOrderByOccurredAtDesc();
}
