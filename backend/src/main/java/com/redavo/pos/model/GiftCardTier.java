package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "gift_card_tiers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiftCardTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private Integer tierLevel;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAmount;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(length = 255)
    private String imageUrl;
}
