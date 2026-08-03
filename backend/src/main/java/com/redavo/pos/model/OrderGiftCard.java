package com.redavo.pos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "order_gift_cards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderGiftCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @JsonIgnore
    private Order order;

    private Integer tierId;
    private BigDecimal amount;
    private String purchaserName;
    private String purchaserEmail;
    private String recipientName;
    private String recipientEmail;
    
    @Column(columnDefinition = "TEXT")
    private String personalMessage;
    
    private LocalDate recipientBirthday;
}
