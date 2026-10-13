package com.redavo.pos.service;

import com.redavo.pos.model.Category;
import com.redavo.pos.model.Product;
import com.redavo.pos.repository.CategoryRepository;
import com.redavo.pos.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    /** Returns all categories sorted by displayOrder asc, then id asc. */
    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAscIdAsc();
    }

    public Category createCategory(Category category) {
        if (categoryRepository.findByName(category.getName()).isPresent()) {
            throw new IllegalArgumentException("Category with name '" + category.getName() + "' already exists");
        }
        // If no displayOrder supplied, place it at the end
        if (category.getDisplayOrder() == null) {
            int maxOrder = categoryRepository.findAllByOrderByDisplayOrderAscIdAsc()
                    .stream()
                    .mapToInt(c -> c.getDisplayOrder() != null ? c.getDisplayOrder() : 0)
                    .max()
                    .orElse(-1);
            category.setDisplayOrder(maxOrder + 1);
        }
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, Category categoryDetails) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        // Check if name is being changed and is already taken
        if (categoryDetails.getName() != null && !category.getName().equalsIgnoreCase(categoryDetails.getName())) {
            if (categoryRepository.findByName(categoryDetails.getName()).isPresent()) {
                throw new IllegalArgumentException("Category with name '" + categoryDetails.getName() + "' already exists");
            }
            category.setName(categoryDetails.getName());
        }

        if (categoryDetails.getDescription() != null) {
            category.setDescription(categoryDetails.getDescription());
        }

        if (categoryDetails.getImageUrl() != null) {
            category.setImageUrl(categoryDetails.getImageUrl());
        }

        if (categoryDetails.getDisplayOrder() != null) {
            category.setDisplayOrder(categoryDetails.getDisplayOrder());
        }

        return categoryRepository.save(category);
    }

    /**
     * Bulk-updates displayOrder for a list of category IDs.
     * The request body is a list of objects: [{ "id": 1, "displayOrder": 0 }, ...]
     */
    @Transactional
    public void reorderCategories(List<Map<String, Integer>> orderList) {
        for (Map<String, Integer> entry : orderList) {
            Integer catId = entry.get("id");
            Integer order = entry.get("displayOrder");
            if (catId == null || order == null) continue;
            categoryRepository.findById(catId.longValue()).ifPresent(cat -> {
                cat.setDisplayOrder(order);
                categoryRepository.save(cat);
            });
        }
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        List<Product> products = productRepository.findByCategoryIgnoreCase(category.getName());

        // Only block if there are ACTIVE (non-deleted) products that still have stock (> 0)
        List<Product> activeStockProducts = products.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() > 0)
                .toList();

        if (!activeStockProducts.isEmpty()) {
            throw new IllegalArgumentException(
                    "Cannot delete category. It contains " + activeStockProducts.size() +
                    " active product(s) with stock. Please remove or zero-out their stock first.");
        }

        // Unlink all remaining products (inactive/deleted and zero-stock active products) from this category
        products.forEach(p -> {
            p.setCategory(null);
            productRepository.save(p);
        });

        categoryRepository.deleteById(id);
    }
}
