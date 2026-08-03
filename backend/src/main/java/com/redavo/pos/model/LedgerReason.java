package com.redavo.pos.model;

/**
 * Reason codes for every entry in the {@code stock_ledger} table.
 * <p>
 * These values are stored as VARCHAR — do not rename without a Flyway migration
 * that updates existing rows.
 */
public enum LedgerReason {

    /** Stock deducted because a sale was completed. */
    SALE,

    /** Stock added because a new shipment / goods receipt was processed. */
    RECEIPT,

    /** Manual admin correction (requires an explanation in referenceId). */
    ADJUSTMENT,

    /** Stock dispatched to another store as part of a StockTransfer. */
    TRANSFER_OUT,

    /** Stock received from another store as part of a StockTransfer. */
    TRANSFER_IN,

    /** Customer return — stock added back. */
    RETURN,

    /** Damaged / expired stock removed without a corresponding sale. */
    WRITE_OFF
}
