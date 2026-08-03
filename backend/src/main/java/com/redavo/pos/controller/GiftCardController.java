package com.redavo.pos.controller;

import com.redavo.pos.dto.GiftCardPurchaseRequest;
import com.redavo.pos.dto.GiftCardRedeemRequest;
import com.redavo.pos.model.GiftCard;
import com.redavo.pos.model.GiftCardLedger;
import com.redavo.pos.model.GiftCardTier;
import com.redavo.pos.service.GiftCardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class GiftCardController {

    private final GiftCardService giftCardService;

    public GiftCardController(GiftCardService giftCardService) {
        this.giftCardService = giftCardService;
    }

    // ── Public endpoints (storefront) ──────────────────────────────────────────

    @GetMapping("/gift-cards/tiers")
    public ResponseEntity<List<GiftCardTier>> getTiers() {
        return ResponseEntity.ok(giftCardService.getAllTiers());
    }

    /**
     * Called by the storefront after PayNow payment success.
     * Creates and (if applicable) delivers the gift card.
     */
    @PostMapping("/gift-cards/purchase")
    public ResponseEntity<GiftCard> purchase(@RequestBody GiftCardPurchaseRequest req) {
        return ResponseEntity.ok(giftCardService.purchaseGiftCard(req));
    }

    /**
     * Validates a gift card code and returns its remaining balance.
     * Used by the checkout page to preview before applying.
     */
    @GetMapping("/gift-cards/validate/{code}")
    public ResponseEntity<Map<String, Object>> validate(@PathVariable String code) {
        return ResponseEntity.ok(giftCardService.validateCard(code));
    }

    /**
     * Partially redeems a gift card against an order.
     * Called from the checkout flow when the order is confirmed.
     */
    @PostMapping("/gift-cards/redeem")
    public ResponseEntity<Map<String, Object>> redeem(@RequestBody GiftCardRedeemRequest req) {
        return ResponseEntity.ok(giftCardService.redeemPartial(req));
    }

    // ── Admin endpoints (POS) ──────────────────────────────────────────────────

    @GetMapping("/admin/gift-cards")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<GiftCard>> getAll() {
        return ResponseEntity.ok(giftCardService.getAllCards());
    }

    @PostMapping("/admin/gift-cards/{id}/void")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<GiftCard> voidCard(@PathVariable Long id) {
        return ResponseEntity.ok(giftCardService.voidCard(id));
    }

    /** Admin override — release a fraud-held card immediately without waiting 30 min. */
    @PostMapping("/admin/gift-cards/{id}/release-now")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GiftCard> releaseGiftCard(@PathVariable Long id) {
        return ResponseEntity.ok(giftCardService.releaseNow(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/gift-cards/tiers/{id}")
    public ResponseEntity<GiftCardTier> updateTier(@PathVariable Integer id, @RequestBody Map<String, Object> req) {
        String name = (String) req.get("name");
        java.math.BigDecimal price = new java.math.BigDecimal(req.get("priceAmount").toString());
        String imageUrl = req.containsKey("imageUrl") ? (String) req.get("imageUrl") : null;
        return ResponseEntity.ok(giftCardService.updateTier(id, name, price, imageUrl));
    }

    @GetMapping("/admin/gift-cards/{id}/ledger")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<GiftCardLedger>> getLedger(@PathVariable Long id) {
        return ResponseEntity.ok(giftCardService.getLedger(id));
    }
}
