package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Materialised stock quantity for one {@link ProductVariant} at one store.
 * <p>
 * <strong>IMPORTANT:</strong> Never write to {@code quantity} directly from
 * application code. All stock changes must flow through
 * {@code StockLedgerService.applyDelta(...)}, which writes a ledger row and
 * updates this field atomically within a {@code @Transactional} boundary.
 * <p>
 * The setter for {@code quantity} is intentionally package-private to enforce
 * this constraint at compile time.
 */
@Entity
@Table(
    name = "stock_levels",
    uniqueConstraints = @UniqueConstraint(columnNames = {"variant_id", "store_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    /**
     * Current on-hand quantity.
     * Must only be modified by {@code StockLedgerService}.
     */
    @Column(nullable = false)
    private int quantity = 0;

    // ── Package-private setter ────────────────────────────────────────────────
    // Lombok generates a public setter for all fields with @Data.
    // We override it here to restrict direct access from outside the service layer.
    // The AOP StockLedgerService uses setQuantityInternal() instead.
    void setQuantityInternal(int quantity) {
        this.quantity = quantity;
    }
}
