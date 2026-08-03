package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "gift_card_ledger")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiftCardLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long giftCardId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amountUsed;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal balanceAfter;

    @Column(nullable = false)
    private LocalDateTime redeemedAt;

    private Long orderId; // Which order consumed this balance

    @PrePersist
    public void onCreate() {
        this.redeemedAt = LocalDateTime.now();
    }
}
