package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Invoice reference — INV-YYYY-NNNN
    @Column(unique = true)
    private String invoiceNumber;

    private Long   storeId;
    private Long   userId;

    private Long   customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String deliveryAddress;

    @Column(columnDefinition = "VARCHAR(20) DEFAULT 'POS'")
    private String source = "POS"; // POS or ONLINE

    @Column(columnDefinition = "VARCHAR(20) DEFAULT 'COLLECTION'")
    private String deliveryMethod = "COLLECTION"; // COLLECTION or DELIVERY

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "order", fetch = FetchType.EAGER)
    private List<OrderItem> items;

    // ── Accounting breakdown ────────────────────────────────────
    @Column(columnDefinition = "DOUBLE PRECISION DEFAULT 0.0")
    private Double subtotal = 0.0;

    @Column(columnDefinition = "DOUBLE PRECISION DEFAULT 0.0")
    private Double vatAmount = 0.0;   // total VAT collected
    private Double tax;         // alias kept for backward compat (= vatAmount)
    private Double total;       // subtotal + vatAmount
    private Double costOfSale;



    // ── Payment & Online Fields ────────────────────────────────
    private String paymentMethod;
    private Double amountTendered;   // cash given by customer
    private Double changeGiven;      // change returned

    private String paynowReference;
    private String paynowPollUrl;

    // Statuses: PENDING_PAYMENT, CONFIRMED, DISPATCHED, DELIVERED, COLLECTED, CANCELLED, COMPLETED
    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'COMPLETED'")
    private String status = "COMPLETED";

    // ── Timestamps ─────────────────────────────────────────────
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        // keep tax in sync with vatAmount for backward compat
        if (this.tax == null && this.vatAmount != null) {
            this.tax = this.vatAmount;
        }
    }
}
