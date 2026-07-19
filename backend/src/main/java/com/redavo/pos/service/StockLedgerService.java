package com.redavo.pos.service;

import com.redavo.pos.model.LedgerReason;
import com.redavo.pos.model.ProductVariant;
import com.redavo.pos.model.StockLedger;
import com.redavo.pos.model.StockLevel;
import com.redavo.pos.repository.ProductRepository;
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
 *   <li>Updates {@code product_variants.stock_quantity} to the sum across all stores</li>
 *   <li>Updates {@code products.stock_quantity} to the sum of all variant totals</li>
 * </ol>
 * Never set {@link StockLevel#getQuantity()} directly — always call
 * {@link #applyDelta(Long, Long, int, LedgerReason, String, String)}.
 */
@Service
public class StockLedgerService {

    private final ProductRepository        productRepo;
    private final ProductVariantRepository variantRepo;
    private final StockLevelRepository     stockLevelRepo;
    private final StockLedgerRepository    ledgerRepo;

    public StockLedgerService(ProductRepository productRepo,
                              ProductVariantRepository variantRepo,
                              StockLevelRepository stockLevelRepo,
                              StockLedgerRepository ledgerRepo) {
        this.productRepo    = productRepo;
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
     */
    @Transactional
    public StockLevel applyDelta(Long variantId, Long storeId, int delta,
                                 LedgerReason reason, String referenceId, String actor) {

        // ── 1. Resolve variant ────────────────────────────────────────────────
        ProductVariant variant = variantRepo.findById(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Variant not found: " + variantId));

        // ── 2. Resolve or create the StockLevel row for this variant × store ─
        StockLevel level = stockLevelRepo
                .findByVariantIdAndStoreId(variantId, storeId)
                .orElseGet(() -> {
                    StockLevel sl = new StockLevel();
                    sl.setVariant(variant);
                    sl.setStoreId(storeId);
                    return sl;
                });

        int newQty = level.getQuantity() + delta;

        // Guard against negative stock for SALE deductions only
        if (newQty < 0 && reason == LedgerReason.SALE) {
            throw new IllegalArgumentException(
                    "Insufficient stock for variant " + variant.getSku() +
                    " at store " + storeId + ": current=" + level.getQuantity() +
                    ", requested=" + Math.abs(delta));
        }

        // ── 3. Persist updated store-level quantity ───────────────────────────
        level.setQuantity(Math.max(0, newQty));
        stockLevelRepo.save(level);

        // ── 4. Append immutable ledger row ────────────────────────────────────
        StockLedger entry = new StockLedger();
        entry.setVariant(variant);
        entry.setStoreId(storeId);
        entry.setQuantityDelta(delta);
        entry.setReasonCode(reason);
        entry.setReferenceId(referenceId);
        entry.setActor(actor != null ? actor : "system");
        ledgerRepo.save(entry);

        // ── 5. Recompute variant cache = SUM of all store stock_levels ────────
        //      We flush first so the query sees the row we just saved above.
        int variantTotal = stockLevelRepo.findByVariantId(variantId).stream()
                .mapToInt(StockLevel::getQuantity)
                .sum();
        variant.setStockQuantity(variantTotal);
        variantRepo.save(variant);

        // ── 6. Recompute product cache = SUM of all variant stock quantities ──
        //      Fetch fresh from DB (not the stale entity in memory) so we get
        //      the up-to-date variant rows we just persisted above.
        Long productId = variant.getProduct().getId();
        int productTotal = variantRepo.findAll().stream()
                .filter(v -> v.getProduct().getId().equals(productId))
                .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                .sum();

        productRepo.findById(productId).ifPresent(p -> {
            p.setStockQuantity(productTotal);
            p.computeStockStatus();
            productRepo.save(p);
        });

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

    /** Returns all stock levels across all stores. */
    public List<StockLevel> getAllStockLevels() {
        return stockLevelRepo.findAll();
    }
}
