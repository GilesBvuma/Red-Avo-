package com.redavo.pos.service;

import com.redavo.pos.model.Product;
import com.redavo.pos.model.ProductCollection;
import com.redavo.pos.repository.CollectionRepository;
import com.redavo.pos.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CollectionService {

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private ProductRepository productRepository;

    // ── Public (storefront) ─────────────────────────────────────────────
    public List<ProductCollection> getAllActive() {
        return collectionRepository.findAllByIsActiveTrueOrderBySortOrderAsc();
    }

    public ProductCollection getBySlug(String slug) {
        return collectionRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Collection not found: " + slug));
    }

    // ── Admin ────────────────────────────────────────────────────────────
    public List<ProductCollection> getAll() {
        return collectionRepository.findAll();
    }

    public ProductCollection getById(Long id) {
        return collectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Collection not found: " + id));
    }

    @Transactional
    public ProductCollection create(ProductCollection collection) {
        String slugToUse = (collection.getSlug() == null || collection.getSlug().isBlank()) 
            ? collection.getName() 
            : collection.getSlug();
        collection.setSlug(generateSlug(slugToUse));
        return collectionRepository.save(collection);
    }

    @Transactional
    public ProductCollection update(Long id, ProductCollection updated) {
        ProductCollection existing = getById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setIsActive(updated.getIsActive());
        existing.setSortOrder(updated.getSortOrder());
        if (updated.getSlug() != null && !updated.getSlug().isBlank()) {
            if (!updated.getSlug().equals(existing.getSlug())) {
                existing.setSlug(generateSlug(updated.getSlug()));
            }
        }
        if (updated.getCoverImageUrl() != null && !updated.getCoverImageUrl().isBlank()) {
            existing.setCoverImageUrl(updated.getCoverImageUrl());
        }
        if (updated.getHeroImageUrl() != null && !updated.getHeroImageUrl().isBlank()) {
            existing.setHeroImageUrl(updated.getHeroImageUrl());
        }
        return collectionRepository.save(existing);
    }

    @Transactional
    public ProductCollection setProducts(Long id, List<Long> productIds) {
        ProductCollection collection = getById(id);
        List<Product> products = productRepository.findAllById(productIds);
        collection.setProducts(products);
        return collectionRepository.save(collection);
    }

    @Transactional
    public ProductCollection removeProduct(Long collectionId, Long productId) {
        ProductCollection collection = getById(collectionId);
        collection.getProducts().removeIf(p -> p.getId().equals(productId));
        return collectionRepository.save(collection);
    }

    @Transactional
    public ProductCollection updateCoverImage(Long id, String imageUrl) {
        ProductCollection collection = getById(id);
        collection.setCoverImageUrl(imageUrl);
        return collectionRepository.save(collection);
    }

    @Transactional
    public ProductCollection updateHeroImage(Long id, String imageUrl) {
        ProductCollection collection = getById(id);
        collection.setHeroImageUrl(imageUrl);
        return collectionRepository.save(collection);
    }

    @Transactional
    public void delete(Long id) {
        collectionRepository.deleteById(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────
    private String generateSlug(String name) {
        if (name == null) return "collection";
        String base = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
        String slug = base;
        int counter = 1;
        while (collectionRepository.existsBySlug(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }
}
