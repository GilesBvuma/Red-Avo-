package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Append-only record of every stock mutation.
 * <p>
 * This table is the source of truth for inventory history. The current stock
 * for a variant at a store is always derivable as:
 * <pre>SELECT SUM(quantity_delta) FROM stock_ledger WHERE variant_id=? AND store_id=?</pre>
 * {@link StockLevel#getQuantity()} caches this sum for query performance, but
 * ledger data is authoritative.
 * <p>
 * Rows are <em>never deleted or updated</em>. Corrections are made by adding
 * a new ADJUSTMENT row.
 */
@Entity
@Table(name = "stock_ledger")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    /**
     * Positive = stock added, Negative = stock removed.
     * Example: -1 for each unit sold, +10 for a new receipt.
     */
    @Column(name = "quantity_delta", nullable = false)
    private int quantityDelta;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason_code", nullable = false, length = 30)
    private LedgerReason reasonCode;

    /**
     * Context-dependent reference: order invoice number, transfer ID,
     * adjustment ticket number, etc.
     */
    @Column(name = "reference_id")
    private String referenceId;

    /** Username of the authenticated user who triggered this mutation. */
    @Column(nullable = false, length = 100)
    private String actor;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    public void onPersist() {
        this.recordedAt = LocalDateTime.now();
    }
}
