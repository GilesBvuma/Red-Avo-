package com.redavo.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "collections")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Card thumbnail shown on /collections listing page */
    @Column(columnDefinition = "TEXT")
    private String coverImageUrl;

    /** Full-bleed hero shown on individual /collections/[slug] page */
    @Column(columnDefinition = "TEXT")
    private String heroImageUrl;

    @Column(nullable = false)
    private Boolean isActive = true;

    /** Controls display order on the storefront collections grid */
    private Integer sortOrder = 0;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "collection_products",
        joinColumns = @JoinColumn(name = "collection_id"),
        inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private List<Product> products = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
