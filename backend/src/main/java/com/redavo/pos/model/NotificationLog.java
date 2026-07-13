package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long customerId;
    private String customerName;
    private String contact;

    /** EMAIL, SMS, or WHATSAPP */
    private String type;

    @Column(length = 2000)
    private String message;

    /** SENT, FAILED, or DEMO */
    private String status;

    private String orderReference;

    private LocalDateTime sentAt;

    @PrePersist
    public void setSentAt() {
        this.sentAt = LocalDateTime.now();
    }
}
