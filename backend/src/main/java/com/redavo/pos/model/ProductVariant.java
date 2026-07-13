package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * A concrete, sellable SKU belonging to a {@link Product}.
 * <p>
 * Each variant represents one colour × size combination. {@code costPrice} and
 * {@code sellPrice} use {@link BigDecimal} with four decimal places to avoid
 * floating-point errors in financial calculations.
 */
@Entity
@Table(name = "product_variants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Product product;

    @Column(length = 100)
    private String color;

    @Column(length = 50)
    private String size;

    /** Unique SKU — used in all stock and order references. */
    @Column(unique = true, nullable = false)
    private String sku;

    /**
     * What the business paid for this variant (weighted-average cost, updated
     * on each receipt). Used for COGS and gross-profit calculations.
     */
    @Column(name = "cost_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal costPrice = BigDecimal.ZERO;

    /**
     * The public selling price for this variant. Promotions may override this
     * at checkout — the discount logic lives in the backend, never the frontend.
     */
    @Column(name = "sell_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal sellPrice = BigDecimal.ZERO;

    @Column(nullable = false)
    private Boolean active = true;
}
