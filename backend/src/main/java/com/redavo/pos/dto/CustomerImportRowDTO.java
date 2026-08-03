package com.redavo.pos.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Typed row representation parsed from the customer Excel import file.
 * One instance per non-blank data row. All fields are nullable — validation
 * is performed by CustomerExcelImportService before upsert.
 */
@Data
public class CustomerImportRowDTO {
    private int rowNumber;

    // Required
    private String email;      // upsert key — required
    private String fullName;   // required — split into firstName/lastName on upsert

    // Identity
    private String customerCode; // "Customer ID" column — always read as String
    private String phone;

    // Address (concatenated into single address field)
    private String address;
    private String city;
    private String region;
    private String postalCode;
    private String country;

    private String notes;

    // Loyalty — CREATE-ONLY fields (never overwritten on re-import)
    private BigDecimal pointsBalance; // maps to lifetimeValue
    private Integer    totalVisits;   // maps to totalPurchases
    private BigDecimal totalSpent;    // maps to lifetimeValue (same field)

    // Timestamps
    private LocalDateTime firstVisitAt;   // CREATE-ONLY
    private LocalDateTime lastVisitAt;    // forward-only update (only if newer)
}
