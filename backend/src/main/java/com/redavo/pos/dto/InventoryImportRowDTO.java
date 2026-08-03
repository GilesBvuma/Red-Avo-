package com.redavo.pos.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Typed row representation parsed from the inventory/stock Excel import file.
 * One instance per non-blank data row (each row = one ProductVariant).
 * Name/Category/Description use fill-down logic — see InventoryExcelImportService.
 */
@Data
public class InventoryImportRowDTO {
    private int rowNumber;

    // Product-level (filled down from first row of each Handle group)
    private String handle;      // groups variants belonging to the same product
    private String productName; // fill-down
    private String category;    // fill-down
    private String description; // fill-down

    // Variant-level
    private String sku;         // required, upsert key — always read as String
    private String barcode;

    // Option attributes
    private String option1Name;
    private String option1Value; // → color
    private String option2Name;
    private String option2Value; // → size
    private String option3Name;
    private String option3Value;

    // Pricing
    private BigDecimal defaultPrice; // → sellPrice
    private BigDecimal cost;         // → costPrice

    // Stock — summed across all detected locations
    private int totalStock;           // sum of all "In stock [*]" columns
    private Integer lowStockThreshold;// from "Low stock [*]", first location used as threshold

    // Flags
    private boolean trackStock;       // "Y"/"N" → boolean
    private boolean hasBundleItems;   // warning flag — set if "SKU of included item" is populated
}
