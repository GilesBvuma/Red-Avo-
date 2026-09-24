package com.redavo.pos.controller;

import com.redavo.pos.model.Product;
import com.redavo.pos.model.WishlistItem;
import com.redavo.pos.repository.ProductRepository;
import com.redavo.pos.repository.WishlistRepository;
import com.redavo.pos.security.CustomerJwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for storefront customer wishlist operations.
 * <p>
 * Authentication: every request must carry a {@code Authorization: Bearer <customer-jwt>}
 * header issued by {@link com.redavo.pos.security.CustomerJwtTokenProvider}.
 * <p>
 * Endpoints:
 * <ul>
 *   <li>GET  /api/wishlist            — list wishlisted product IDs for the customer</li>
 *   <li>POST /api/wishlist/{productId} — add a product to the wishlist (idempotent)</li>
 *   <li>DELETE /api/wishlist/{productId} — remove a product from the wishlist</li>
 *   <li>GET  /api/wishlist/validate    — validate token, returns customer email (used for auto-login)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired private WishlistRepository wishlistRepository;
    @Autowired private ProductRepository  productRepository;
    @Autowired private CustomerJwtTokenProvider customerJwtTokenProvider;

    // ── Token validation helper ──────────────────────────────────────────────
    private Long resolveCustomerId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (!StringUtils.hasText(header) || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        if (!customerJwtTokenProvider.validateToken(token)) return null;
        return customerJwtTokenProvider.getCustomerIdFromToken(token);
    }

    // ── GET /api/wishlist/validate ───────────────────────────────────────────
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (!StringUtils.hasText(header) || !header.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "No token"));
        }
        String token = header.substring(7);
        if (!customerJwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
        }
        return ResponseEntity.ok(Map.of(
            "customerId", customerJwtTokenProvider.getCustomerIdFromToken(token),
            "email",      customerJwtTokenProvider.getEmailFromToken(token)
        ));
    }

    // ── GET /api/wishlist ────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<?> getWishlist(HttpServletRequest request) {
        Long customerId = resolveCustomerId(request);
        if (customerId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        List<WishlistItem> items = wishlistRepository.findAllByCustomerId(customerId);
        List<Long> productIds = items.stream().map(WishlistItem::getProductId).toList();

        // Also return the product details so the wishlist page can render without a second call
        List<Product> products = productRepository.findAllById(productIds);

        return ResponseEntity.ok(Map.of(
            "productIds", productIds,
            "products",   products
        ));
    }

    // ── POST /api/wishlist/{productId} ───────────────────────────────────────
    @PostMapping("/{productId}")
    public ResponseEntity<?> addToWishlist(@PathVariable Long productId,
                                           HttpServletRequest request) {
        Long customerId = resolveCustomerId(request);
        if (customerId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        if (!productRepository.existsById(productId)) {
            return ResponseEntity.status(404).body(Map.of("error", "Product not found"));
        }

        if (!wishlistRepository.existsByCustomerIdAndProductId(customerId, productId)) {
            WishlistItem item = new WishlistItem();
            item.setCustomerId(customerId);
            item.setProductId(productId);
            wishlistRepository.save(item);
        }

        return ResponseEntity.ok(Map.of("wishlisted", true, "productId", productId));
    }

    // ── DELETE /api/wishlist/{productId} ─────────────────────────────────────
    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeFromWishlist(@PathVariable Long productId,
                                                HttpServletRequest request) {
        Long customerId = resolveCustomerId(request);
        if (customerId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        wishlistRepository.deleteByCustomerIdAndProductId(customerId, productId);
        return ResponseEntity.ok(Map.of("wishlisted", false, "productId", productId));
    }
}
