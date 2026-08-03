package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StockLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    /**
     * Current on-hand quantity.
     * Must only be modified by {@code StockLedgerService.applyDelta()} within a
     * {@code @Transactional} boundary. Do not call {@code setQuantity()} directly
     * from application code outside of {@code StockLedgerService}.
     */
    @Column(nullable = false)
    private int quantity = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;
}
