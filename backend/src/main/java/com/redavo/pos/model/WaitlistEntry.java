package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "waitlist")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaitlistEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String phone;

    /** What they're interested in — e.g. "Leggings", "Sets", "Drop alerts" */
    private String interest;

    /** Where sign-up originated — STOREFRONT, POS, SOCIAL, etc. */
    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'STOREFRONT'")
    private String source = "STOREFRONT";

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
