package com.redavo.pos.service;

import com.redavo.pos.model.LedgerReason;
import com.redavo.pos.model.Product;
import com.redavo.pos.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockLedgerService stockLedgerService;

    @Autowired
    private CategoryService categoryService;

    private void ensureCategoryExists(String categoryName) {
        if (categoryName != null && !categoryName.trim().isEmpty()) {
            boolean exists = categoryService.getAllCategories().stream()
                .anyMatch(c -> c.getName().equalsIgnoreCase(categoryName.trim()));
            if (!exists) {
                com.redavo.pos.model.Category cat = new com.redavo.pos.model.Category();
                cat.setName(categoryName.trim());
                cat.setDescription("Auto-generated category");
                try {
                    categoryService.createCategory(cat);
                } catch (Exception e) {
                    // Ignore if it was created concurrently
                }
            }
        }
    }

    // ── Queries ───────────────────────────────────────────────────────────

    public List<Product> getAllProducts() {
        return productRepository.findByIsActiveTrue();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found: " + id));
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategoryAndIsActiveTrue(category);
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findByStockQuantityLessThanEqualAndIsActiveTrue(5);
    }

    // ── Create ────────────────────────────────────────────────────────────

    @Transactional
    public Product createProduct(Product product) {
        ensureCategoryExists(product.getCategory());
        // Set bi-directional links
        if (product.getVariants() != null) {
            for (com.redavo.pos.model.ProductVariant v : product.getVariants()) {
                v.setProduct(product);
            }
        }
        product.computeStockStatus();

        // Persist product + variants first so IDs are generated
        Product saved = productRepository.save(product);
        productRepository.flush();

        // Apply initial stock via ledger for each variant that has stock.
        // StockLedgerService will cascade-update the variant and product caches.
        if (saved.getVariants() != null) {
            java.util.List<com.redavo.pos.model.ProductVariant> variantsCopy = new java.util.ArrayList<>(saved.getVariants());
            for (com.redavo.pos.model.ProductVariant v : variantsCopy) {
                int qty = v.getStockQuantity() != null ? v.getStockQuantity() : 0;
                if (qty > 0) {
                    // Zero out the cache first so applyDelta's delta = qty (correct)
                    v.setStockQuantity(0);
                    stockLedgerService.applyDelta(
                        v.getId(),
                        1L, // Default store
                        qty,
                        LedgerReason.ADJUSTMENT,
                        "Initial Stock",
                        "admin"
                    );
                }
            }
        }

        // Return the freshly reloaded product (caches are now correct)
        return productRepository.findById(saved.getId()).orElse(saved);
    }

    // ── Update ────────────────────────────────────────────────────────────

    @Transactional
    public Product updateProduct(Long id, Product updated) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));

        // Metadata fields
        if (updated.getName()              != null) product.setName(updated.getName());
        if (updated.getCategory()          != null) {
            product.setCategory(updated.getCategory());
            ensureCategoryExists(updated.getCategory());
        }
        if (updated.getSku()               != null) product.setSku(updated.getSku());
        if (updated.getPrice()             != null) product.setPrice(updated.getPrice());
        if (updated.getSalePrice()         != null) product.setSalePrice(updated.getSalePrice());
        if (updated.getOnSale()            != null) product.setOnSale(updated.getOnSale());
        if (updated.getLowStockThreshold() != null) product.setLowStockThreshold(updated.getLowStockThreshold());
        if (updated.getColors()            != null) product.setColors(updated.getColors());
        if (updated.getSizes()             != null) product.setSizes(updated.getSizes());
        if (updated.getVatRate()           != null) product.setVatRate(updated.getVatRate());
        if (updated.getDiscount()          != null) product.setDiscount(updated.getDiscount());
        if (updated.getDescription()       != null) product.setDescription(updated.getDescription());
        if (updated.getIsActive()          != null) product.setIsActive(updated.getIsActive());
        if (updated.getImageUrl() != null) {
            product.setImageUrl(updated.getImageUrl().isEmpty() ? null : updated.getImageUrl());
        }
        if (updated.getImageUrls() != null) {
            java.util.List<String> urlsCopy = new java.util.ArrayList<>(updated.getImageUrls());
            product.getImageUrls().clear();
            product.getImageUrls().addAll(urlsCopy);
        }
        if (updated.getSupplierInvoices() != null) {
            java.util.List<String> invoicesCopy = new java.util.ArrayList<>(updated.getSupplierInvoices());
            if (product.getSupplierInvoices() == null) {
                product.setSupplierInvoices(new java.util.ArrayList<>());
            }
            product.getSupplierInvoices().clear();
            product.getSupplierInvoices().addAll(invoicesCopy);
        }

        // Variant stock changes ─────────────────────────────────────────────
        // NOTE: We deliberately do NOT call productRepository.save() again after
        // the applyDelta calls below.  StockLedgerService handles all cache updates
        // by loading fresh entities from the DB.  A second save() here with the
        // stale in-memory product would overwrite the freshly-computed stock totals.
        if (updated.getVariants() != null) {
            if (product.getVariants() == null) {
                product.setVariants(new java.util.ArrayList<>());
            }

            java.util.Map<Long, com.redavo.pos.model.ProductVariant> existing = new java.util.HashMap<>();
            for (com.redavo.pos.model.ProductVariant v : product.getVariants()) {
                if (v.getId() != null) existing.put(v.getId(), v);
            }

            for (com.redavo.pos.model.ProductVariant incoming : updated.getVariants()) {
                if (incoming.getId() != null && existing.containsKey(incoming.getId())) {
                    // ── Existing variant: apply stock delta if it changed ──────
                    com.redavo.pos.model.ProductVariant ext = existing.get(incoming.getId());
                    ext.setColor(incoming.getColor());
                    ext.setSize(incoming.getSize());
                    ext.setSku(incoming.getSku());

                    int currentStock = ext.getStockQuantity() != null ? ext.getStockQuantity() : 0;
                    int newStock     = incoming.getStockQuantity() != null ? incoming.getStockQuantity() : 0;
                    int delta        = newStock - currentStock;

                    if (delta != 0) {
                        stockLedgerService.applyDelta(
                            ext.getId(),
                            1L,
                            delta,
                            LedgerReason.ADJUSTMENT,
                            "Manual UI Edit",
                            "admin"
                        );
                        // Keep in-memory value consistent so save() below writes correct number
                        ext.setStockQuantity(newStock);
                    }
                    existing.remove(incoming.getId());

                } else {
                    // ── New variant: persist first, then seed ledger ──────────
                    incoming.setProduct(product);
                    product.getVariants().add(incoming);
                }
            }
        }

        // Save metadata + new variants (no stock-quantity changes here — ledger owns that)
        product.computeStockStatus();
        Product savedProduct = productRepository.save(product);
        productRepository.flush();

        // For brand-new variants (just persisted above), apply their initial stock via ledger
        if (savedProduct.getVariants() != null) {
            java.util.List<com.redavo.pos.model.ProductVariant> variantsCopy =
                    new java.util.ArrayList<>(savedProduct.getVariants());
            for (com.redavo.pos.model.ProductVariant v : variantsCopy) {
                int qty = v.getStockQuantity() != null ? v.getStockQuantity() : 0;
                if (qty > 0 && stockLedgerService.getLedger(v.getId(), 1L).isEmpty()) {
                    v.setStockQuantity(0); // clear so delta calculation inside applyDelta is correct
                    stockLedgerService.applyDelta(
                        v.getId(),
                        1L,
                        qty,
                        LedgerReason.ADJUSTMENT,
                        "Initial Stock",
                        "admin"
                    );
                }
            }
        }

        // Return freshly loaded product — all caches will be correct
        return productRepository.findById(savedProduct.getId()).orElse(savedProduct);
    }

    // ── Delete (soft) ─────────────────────────────────────────────────────

    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));
        product.setIsActive(false);
        productRepository.save(product);
    }

    // ── Blocked direct-stock endpoint ─────────────────────────────────────
    // Call via StockLedgerService.applyDelta() instead.

    public Product updateStock(Long id, int quantity) {
        throw new UnsupportedOperationException(
                "Direct stock updates are disabled. Use StockLedgerService or the Transfers flow."
        );
    }
}
