package com.redavo.pos.service;

import com.redavo.pos.model.LedgerReason;
import com.redavo.pos.model.Product;
import com.redavo.pos.model.ProductVariant;
import com.redavo.pos.repository.ProductRepository;
import com.redavo.pos.repository.ProductVariantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.HashMap;
import java.util.ArrayList;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private StockLedgerService stockLedgerService;

    @Autowired
    private CategoryService categoryService;

    private String normalizeKey(String color, String size) {
        String c = (color != null) ? color.trim().toLowerCase() : "default";
        String s = (size != null) ? size.trim().toLowerCase() : "default";
        return c + "-" + s;
    }

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
        // Set bi-directional links & ensure unique SKUs
        if (product.getVariants() != null) {
            Set<String> skusInPayload = new HashSet<>();
            for (ProductVariant v : product.getVariants()) {
                v.setProduct(product);
                if (v.getSku() != null && !v.getSku().trim().isEmpty()) {
                    String baseSku = v.getSku().trim();
                    String finalSku = baseSku;
                    int counter = 1;
                    while (skusInPayload.contains(finalSku.toLowerCase()) || productVariantRepository.existsBySku(finalSku)) {
                        finalSku = baseSku + "-" + counter++;
                    }
                    v.setSku(finalSku);
                    skusInPayload.add(finalSku.toLowerCase());
                }
            }
        }
        product.computeStockStatus();

        // Persist product + variants first so IDs are generated
        Product saved = productRepository.save(product);
        productRepository.flush();

        // Apply initial stock via ledger for each variant that has stock.
        // StockLedgerService will cascade-update the variant and product caches.
        if (saved.getVariants() != null) {
            List<ProductVariant> variantsCopy = new ArrayList<>(saved.getVariants());
            for (ProductVariant v : variantsCopy) {
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
            List<String> urlsCopy = new ArrayList<>(updated.getImageUrls());
            product.getImageUrls().clear();
            product.getImageUrls().addAll(urlsCopy);
        }
        if (updated.getSupplierInvoices() != null) {
            List<String> invoicesCopy = new ArrayList<>(updated.getSupplierInvoices());
            if (product.getSupplierInvoices() == null) {
                product.setSupplierInvoices(new ArrayList<>());
            }
            product.getSupplierInvoices().clear();
            product.getSupplierInvoices().addAll(invoicesCopy);
        }

        // Variant stock changes ─────────────────────────────────────────────
        if (updated.getVariants() != null) {
            if (product.getVariants() == null) {
                product.setVariants(new ArrayList<>());
            }

            Map<Long, ProductVariant> existingById = new HashMap<>();
            Map<String, ProductVariant> existingBySku = new HashMap<>();
            Map<String, ProductVariant> existingByColorSize = new HashMap<>();

            for (ProductVariant v : product.getVariants()) {
                if (v.getId() != null) existingById.put(v.getId(), v);
                if (v.getSku() != null && !v.getSku().trim().isEmpty()) {
                    existingBySku.put(v.getSku().trim().toLowerCase(), v);
                }
                existingByColorSize.put(normalizeKey(v.getColor(), v.getSize()), v);
            }

            Set<String> usedSkusInTransaction = new HashSet<>();
            for (ProductVariant v : product.getVariants()) {
                if (v.getSku() != null) usedSkusInTransaction.add(v.getSku().trim().toLowerCase());
            }

            for (ProductVariant incoming : updated.getVariants()) {
                ProductVariant ext = null;

                // 1. Match by ID
                if (incoming.getId() != null && existingById.containsKey(incoming.getId())) {
                    ext = existingById.get(incoming.getId());
                }
                // 2. Match by SKU if provided
                if (ext == null && incoming.getSku() != null && !incoming.getSku().trim().isEmpty()) {
                    ext = existingBySku.get(incoming.getSku().trim().toLowerCase());
                }
                // 3. Match by Color + Size (case-insensitive)
                if (ext == null) {
                    ext = existingByColorSize.get(normalizeKey(incoming.getColor(), incoming.getSize()));
                }
                // 4. Match by DB lookup if SKU exists and belongs to this product
                if (ext == null && incoming.getSku() != null && !incoming.getSku().trim().isEmpty()) {
                    Optional<ProductVariant> dbVariant = productVariantRepository.findBySku(incoming.getSku().trim());
                    if (dbVariant.isPresent() && dbVariant.get().getProduct() != null &&
                            dbVariant.get().getProduct().getId().equals(product.getId())) {
                        ext = dbVariant.get();
                        if (!product.getVariants().contains(ext)) {
                            product.getVariants().add(ext);
                        }
                    }
                }

                if (ext != null) {
                    // ── Existing variant: update fields & apply stock delta ──────
                    if (incoming.getColor() != null) ext.setColor(incoming.getColor());
                    if (incoming.getSize() != null) ext.setSize(incoming.getSize());
                    if (incoming.getCostPrice() != null) ext.setCostPrice(incoming.getCostPrice());
                    if (incoming.getSellPrice() != null) ext.setSellPrice(incoming.getSellPrice());
                    if (incoming.getActive() != null) ext.setActive(incoming.getActive());
                    if (incoming.getSku() != null && !incoming.getSku().trim().isEmpty()) {
                        ext.setSku(incoming.getSku().trim());
                    }

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
                        ext.setStockQuantity(newStock);
                    }

                    // Remove from matching pools so another incoming row doesn't re-claim it
                    if (ext.getId() != null) existingById.remove(ext.getId());
                    if (ext.getSku() != null) existingBySku.remove(ext.getSku().trim().toLowerCase());
                    existingByColorSize.remove(normalizeKey(ext.getColor(), ext.getSize()));

                } else {
                    // ── Brand new variant: ensure unique SKU before adding ────
                    String desiredSku = (incoming.getSku() != null && !incoming.getSku().trim().isEmpty())
                            ? incoming.getSku().trim()
                            : (product.getSku() != null ? product.getSku() : "PROD") + "-" +
                              (incoming.getColor() != null ? incoming.getColor().substring(0, Math.min(3, incoming.getColor().length())).toUpperCase() : "DEF") + "-" +
                              (incoming.getSize() != null ? incoming.getSize() : "DEF");

                    String finalSku = desiredSku;
                    int counter = 1;
                    while (usedSkusInTransaction.contains(finalSku.toLowerCase()) || productVariantRepository.existsBySku(finalSku)) {
                        finalSku = desiredSku + "-" + counter++;
                    }
                    incoming.setSku(finalSku);
                    usedSkusInTransaction.add(finalSku.toLowerCase());

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
