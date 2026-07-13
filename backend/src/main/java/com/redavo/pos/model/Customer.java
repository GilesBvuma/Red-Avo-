package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;

    @Column(unique = true)
    private String email;

    private String phoneNumber;

    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean whatsappOptIn = false;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer totalPurchases = 0;

    private Double lifetimeValue = 0.0;    // total spend across all orders

    private String address;
    private String notes;                  // staff notes about customer

    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive = true;

    private LocalDateTime createdAt;
    private LocalDateTime lastPurchaseAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.lifetimeValue == null) this.lifetimeValue = 0.0;
        if (this.totalPurchases == null) this.totalPurchases = 0;
    }

    @Transient
    public String getFullName() {
        return firstName + " " + lastName;
    }
}
