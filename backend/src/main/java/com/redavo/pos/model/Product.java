package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String category;
    private String sku;

    private Double price;

    // Sale pricing
    private Boolean onSale = false;
    private Double  salePrice;

    // Stock
    private Integer stockQuantity = 0;
    private Integer lowStockThreshold = 5;
    private String  stockStatus;          // computed in @PrePersist/@PreUpdate

    // Product attributes (stored as comma-separated values)
    @Column(columnDefinition = "TEXT")
    private String colors;    // e.g. "Crimson,Navy,Pink,Black"

    @Column(columnDefinition = "TEXT")
    private String sizes;     // e.g. "XS,S,M,L,XL,XXL"

    // Financials
    @Column(columnDefinition = "DOUBLE PRECISION DEFAULT 15.0")
    private Double vatRate = 15.0;  // Zimbabwe standard VAT rate

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer discount = 0;   // percentage discount on original price

    // Media
    @Column(columnDefinition = "TEXT")
    private String imageUrl; // Primary image for quick rendering

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    private java.util.List<String> imageUrls = new java.util.ArrayList<>();

    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive = true;

    private String description;

    // ── Stock status is auto-computed on every save ──────────────────
    @PrePersist
    @PreUpdate
    public void computeStockStatus() {
        int threshold = (lowStockThreshold != null) ? lowStockThreshold : 5;
        if (stockQuantity == null || stockQuantity == 0) {
            this.stockStatus = "OUT_OF_STOCK";
        } else if (stockQuantity <= threshold) {
            this.stockStatus = "LOW_STOCK";
        } else {
            this.stockStatus = "IN_STOCK";
        }
    }

    // ── Effective selling price (sale price overrides regular price) ─
    @Transient
    public Double getEffectivePrice() {
        if (Boolean.TRUE.equals(onSale) && salePrice != null && salePrice > 0) {
            return salePrice;
        }
        if (discount != null && discount > 0) {
            return price * (1 - discount / 100.0);
        }
        return price;
    }

    // ── VAT amount on the effective price ────────────────────────────
    @Transient
    public Double getVatAmount() {
        double rate = (vatRate != null) ? vatRate : 15.0;
        return getEffectivePrice() * (rate / 100.0);
    }

    // ── Price including VAT ───────────────────────────────────────────
    @Transient
    public Double getPriceIncVat() {
        return getEffectivePrice() + getVatAmount();
    }

    // ── Variants ──────────────────────────────────────────────────────
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private java.util.List<ProductVariant> variants;
}
