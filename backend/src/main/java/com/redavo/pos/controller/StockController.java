package com.redavo.pos.controller;

import com.redavo.pos.model.StockLedger;
import com.redavo.pos.model.StockLevel;
import com.redavo.pos.model.ProductVariant;
import com.redavo.pos.repository.ProductVariantRepository;
import com.redavo.pos.security.RedAvoUserDetails;
import com.redavo.pos.service.StockLedgerService;
import com.redavo.pos.model.LedgerReason;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * REST endpoints for product variants and the stock ledger.
 * <p>
 * Read endpoints are public so the storefront and POS can fetch
 * stock without a token (Phase 1 — tighten in Phase 2).
 */
@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"},
             allowCredentials = "true")
public class StockController {

    private final StockLedgerService       stockService;
    private final ProductVariantRepository variantRepo;

    public StockController(StockLedgerService stockService,
                           ProductVariantRepository variantRepo) {
        this.stockService = stockService;
        this.variantRepo  = variantRepo;
    }

    // ── Variants ─────────────────────────────────────────────────────────────

    /** List active variants for a product. */
    @GetMapping("/products/{productId}/variants")
    public ResponseEntity<List<ProductVariant>> getVariants(
            @PathVariable Long productId) {
        return ResponseEntity.ok(
                variantRepo.findByProductIdAndActiveTrue(productId));
    }

    /** Create a new variant (ADMIN only). */
    @PostMapping("/products/{productId}/variants")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductVariant> createVariant(
            @PathVariable Long productId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal RedAvoUserDetails actor) {

        // Validate required fields
        String sku = (String) body.get("sku");
        if (sku == null || sku.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (variantRepo.existsBySku(sku)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        ProductVariant variant = new ProductVariant();
        // product reference resolved via product_id from path
        com.redavo.pos.model.Product productRef = new com.redavo.pos.model.Product();
        productRef.setId(productId);
        variant.setProduct(productRef);

        variant.setSku(sku);
        variant.setColor((String) body.get("color"));
        variant.setSize((String) body.get("size"));
        variant.setCostPrice(parseBD(body.get("costPrice")));
        variant.setSellPrice(parseBD(body.get("sellPrice")));
        variant.setActive(true);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(variantRepo.save(variant));
    }

    /** Deactivate a variant (soft-delete). */
    @DeleteMapping("/variants/{variantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateVariant(@PathVariable Long variantId) {
        variantRepo.findById(variantId).ifPresent(v -> {
            v.setActive(false);
            variantRepo.save(v);
        });
        return ResponseEntity.noContent().build();
    }

    // ── Stock levels ──────────────────────────────────────────────────────────

    /** All stock levels for a store. */
    @GetMapping("/levels")
    public ResponseEntity<List<StockLevel>> getLevels(
            @RequestParam Long storeId,
            @AuthenticationPrincipal RedAvoUserDetails actor) {
        // ADMIN or same-store employee
        if (actor != null && !actor.canAccessStore(storeId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(stockService.getStockLevels(storeId));
    }

    // ── Stock ledger ──────────────────────────────────────────────────────────

    /** Apply a manual stock delta (receipt, adjustment, etc.). */
    @PostMapping("/ledger")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> applyDelta(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal RedAvoUserDetails actor) {

        try {
            Long         variantId   = Long.valueOf(body.get("variantId").toString());
            Long         storeId     = Long.valueOf(body.get("storeId").toString());
            int          delta       = Integer.parseInt(body.get("delta").toString());
            LedgerReason reason      = LedgerReason.valueOf(
                    body.getOrDefault("reason", "ADJUSTMENT").toString());
            String       referenceId = (String) body.get("referenceId");

            // Employees may only touch their own store
            if (actor != null && !actor.canAccessStore(storeId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied for store " + storeId));
            }

            String username = actor != null ? actor.getUsername() : "system";
            StockLevel updated = stockService.applyDelta(
                    variantId, storeId, delta, reason, referenceId, username);

            return ResponseEntity.ok(updated);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Ledger history for a variant at a store. */
    @GetMapping("/ledger")
    public ResponseEntity<List<StockLedger>> getLedger(
            @RequestParam Long variantId,
            @RequestParam Long storeId,
            @AuthenticationPrincipal RedAvoUserDetails actor) {
        if (actor != null && !actor.canAccessStore(storeId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(stockService.getLedger(variantId, storeId));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private BigDecimal parseBD(Object val) {
        if (val == null) return BigDecimal.ZERO;
        try { return new BigDecimal(val.toString()); }
        catch (NumberFormatException e) { return BigDecimal.ZERO; }
    }
}
