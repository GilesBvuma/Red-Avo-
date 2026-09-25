package com.redavo.pos.controller;

import com.redavo.pos.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AbandonedCartController
 * ─────────────────────────────────────────────────────────────────────────────
 * Public (no-auth) endpoint called by the storefront client-side
 * when it detects a cart that has been idle for ≥ 1 hour with a
 * known email address.
 *
 * Rate-limiting: in-memory map (email → last notification timestamp).
 * Max 1 abandoned-cart notification per email per 24 hours.
 * This resets on server restart — acceptable for a low-volume store.
 *
 * POST /api/abandoned-cart/notify
 * Body: { "email": "...", "name": "...", "cartSummary": "2 items", "cartValue": "$42.00" }
 */
@RestController
@RequestMapping("/api/abandoned-cart")
public class AbandonedCartController {

    private static final long COOLDOWN_MS = 24L * 60 * 60 * 1000; // 24 hours

    /** In-memory rate-limit store: email → last notification epoch-ms */
    private final ConcurrentHashMap<String, Long> lastNotified = new ConcurrentHashMap<>();

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/notify")
    public ResponseEntity<Map<String, String>> notifyAbandonedCart(
            @RequestBody Map<String, String> body) {

        String email       = body.getOrDefault("email", "").trim().toLowerCase();
        String name        = body.getOrDefault("name", "").trim();
        String cartSummary = body.getOrDefault("cartSummary", "some items");
        String cartValue   = body.getOrDefault("cartValue", "");

        if (email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "error", "message", "email is required"));
        }

        // ── Rate-limit check ─────────────────────────────────────────────────
        long now = Instant.now().toEpochMilli();
        Long last = lastNotified.get(email);
        if (last != null && (now - last) < COOLDOWN_MS) {
            return ResponseEntity.ok(Map.of(
                    "status", "skipped",
                    "message", "Already notified within 24h cooldown"));
        }

        // ── Fire notifications ───────────────────────────────────────────────
        try {
            notificationService.sendAbandonedCartEmail(name, email, cartSummary, cartValue);
            lastNotified.put(email, now);
            System.out.println("[ABANDONED CART] Recovery triggered for: " + email);
            return ResponseEntity.ok(Map.of("status", "ok", "channel", "EMAIL"));
        } catch (Exception e) {
            System.err.println("[ABANDONED CART ❌] " + email + " — " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
