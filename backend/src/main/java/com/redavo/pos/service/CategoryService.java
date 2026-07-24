package com.redavo.pos.service;

import com.redavo.pos.model.Category;
import com.redavo.pos.model.Product;
import com.redavo.pos.repository.CategoryRepository;
import com.redavo.pos.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category createCategory(Category category) {
        if (categoryRepository.findByName(category.getName()).isPresent()) {
            throw new IllegalArgumentException("Category with name '" + category.getName() + "' already exists");
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
        
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
                
        List<Product> products = productRepository.findByCategoryIgnoreCase(category.getName());
        boolean hasStock = products.stream().anyMatch(p -> p.getStockQuantity() != null && p.getStockQuantity() > 0);
        
        if (!products.isEmpty() && hasStock) {
            throw new IllegalArgumentException("Cannot delete category. It contains products with active stock.");
        }
        
        categoryRepository.deleteById(id);
    }
}
