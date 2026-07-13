package com.redavo.pos.repository;

import com.redavo.pos.model.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    List<NotificationLog> findByCustomerId(Long id);

    long countBySentAtAfter(LocalDateTime date);
}
