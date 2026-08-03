package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "gift_cards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiftCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code; // GC-XXXX-XXXX-XXXX

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal initialBalance;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal remainingBalance;

    @Column(nullable = false)
    private String purchaserEmail;

    private String purchaserName;

    @Column(nullable = false)
    private String recipientEmail;

    private String recipientName;

    @Column(columnDefinition = "TEXT")
    private String personalMessage;

    private LocalDate recipientBirthday; // Used by birthday reminder cron job

    private String tierName; // Standard, Gold, Premium, Platinum

    @Column(length = 255)
    private String imageUrl;

    @Column(nullable = false)
    private Boolean delivered = false;

    // Fraud hold — cards > $50 are held 30 min before delivery
    @Column(nullable = false)
    private Boolean deliveryHeld = false;

    private LocalDateTime releaseAt; // When to auto-release held card

    // PENDING | ACTIVE | REDEEMED | VOIDED
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(nullable = false)
    private LocalDateTime purchasedAt;

    // Always NULL — gift cards never expire
    private LocalDateTime expiresAt;

    @PrePersist
    public void onCreate() {
        this.purchasedAt = LocalDateTime.now();
    }
}
