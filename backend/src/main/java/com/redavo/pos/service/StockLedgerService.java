package com.redavo.pos.service;

import com.redavo.pos.model.LedgerReason;
import com.redavo.pos.model.ProductVariant;
import com.redavo.pos.model.StockLedger;
import com.redavo.pos.model.StockLevel;
import com.redavo.pos.repository.ProductVariantRepository;
import com.redavo.pos.repository.StockLedgerRepository;
import com.redavo.pos.repository.StockLevelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * The <em>only</em> authorised path for modifying stock quantities.
 * <p>
 * Every call atomically:
 * <ol>
 *   <li>Inserts a row into {@code stock_ledger}</li>
 *   <li>Creates or updates {@code stock_levels} by the same delta</li>
 * </ol>
 * Never set {@link StockLevel#getQuantity()} directly — always call
 * {@link #applyDelta(Long, Long, int, LedgerReason, String, String)}.
 */
@Service
public class StockLedgerService {

    private final ProductVariantRepository variantRepo;
    private final StockLevelRepository     stockLevelRepo;
    private final StockLedgerRepository    ledgerRepo;

    public StockLedgerService(ProductVariantRepository variantRepo,
                              StockLevelRepository stockLevelRepo,
                              StockLedgerRepository ledgerRepo) {
        this.variantRepo    = variantRepo;
        this.stockLevelRepo = stockLevelRepo;
        this.ledgerRepo     = ledgerRepo;
    }

    /**
     * Apply a stock delta for the given variant at the given store.
     *
     * @param variantId   PK of the {@link ProductVariant}
     * @param storeId     store receiving or losing stock
     * @param delta       positive = adding stock, negative = removing stock
     * @param reason      why this change is happening
     * @param referenceId invoice number, transfer ID, etc. (nullable)
     * @param actor       username of the authenticated user
     * @return the updated {@link StockLevel}
     * @throws IllegalArgumentException if variant not found or if delta would
     *                                  push stock below zero (for non-adjustment operations)
     */
    @Transactional
    public StockLevel applyDelta(Long variantId, Long storeId, int delta,
                                 LedgerReason reason, String referenceId, String actor) {

        ProductVariant variant = variantRepo.findById(variantId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Variant not found: " + variantId));

        // Resolve or create the stock level row for this variant × store pair
        StockLevel level = stockLevelRepo
                .findByVariantIdAndStoreId(variantId, storeId)
                .orElseGet(() -> {
                    StockLevel sl = new StockLevel();
                    sl.setVariant(variant);
                    sl.setStoreId(storeId);
                    // quantity defaults to 0 — set in next step
                    return sl;
                });

        int newQty = level.getQuantity() + delta;

        // Guard against negative stock for SALE deductions (not for adjustments)
        if (newQty < 0 && reason == LedgerReason.SALE) {
            throw new IllegalArgumentException(
                    "Insufficient stock for variant " + variant.getSku() +
                    " at store " + storeId + ": current=" + level.getQuantity() +
                    ", requested=" + Math.abs(delta));
        }

        // Update the materialised quantity
        level.setQuantity(Math.max(0, newQty));
        stockLevelRepo.save(level);

        // Append ledger row
        StockLedger entry = new StockLedger();
        entry.setVariant(variant);
        entry.setStoreId(storeId);
        entry.setQuantityDelta(delta);
        entry.setReasonCode(reason);
        entry.setReferenceId(referenceId);
        entry.setActor(actor != null ? actor : "system");
        ledgerRepo.save(entry);

        return level;
    }

    /** Returns all ledger entries for a variant at a store, most recent first. */
    public List<StockLedger> getLedger(Long variantId, Long storeId) {
        return ledgerRepo.findByVariantIdAndStoreIdOrderByRecordedAtDesc(variantId, storeId);
    }

    /** Returns all ledger entries for an entire store, most recent first. */
    public List<StockLedger> getStoreLedger(Long storeId) {
        return ledgerRepo.findByStoreIdOrderByRecordedAtDesc(storeId);
    }

    /** Returns all stock levels for a given store. */
    public List<StockLevel> getStockLevels(Long storeId) {
        return stockLevelRepo.findByStoreId(storeId);
    }
}
