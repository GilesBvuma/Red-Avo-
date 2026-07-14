package com.redavo.pos.service;

import com.redavo.pos.model.Product;
import com.redavo.pos.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public Product createProduct(Product product) {
        if (product.getVariants() != null) {
            for (com.redavo.pos.model.ProductVariant v : product.getVariants()) {
                v.setProduct(product);
            }
        }
        product.computeStockStatus();
        return productRepository.save(product);
    }

    public Product updateStock(Long id, int quantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        product.setStockQuantity(quantity);
        product.computeStockStatus();
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product updated) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        if (updated.getName()        != null) product.setName(updated.getName());
        if (updated.getCategory()    != null) product.setCategory(updated.getCategory());
        if (updated.getSku()         != null) product.setSku(updated.getSku());
        if (updated.getPrice()       != null) product.setPrice(updated.getPrice());
        if (updated.getSalePrice()   != null) product.setSalePrice(updated.getSalePrice());
        if (updated.getOnSale()      != null) product.setOnSale(updated.getOnSale());
        if (updated.getStockQuantity()     != null) product.setStockQuantity(updated.getStockQuantity());
        if (updated.getLowStockThreshold() != null) product.setLowStockThreshold(updated.getLowStockThreshold());
        if (updated.getColors()      != null) product.setColors(updated.getColors());
        if (updated.getSizes()       != null) product.setSizes(updated.getSizes());
        if (updated.getVatRate()     != null) product.setVatRate(updated.getVatRate());
        if (updated.getDiscount()    != null) product.setDiscount(updated.getDiscount());
        if (updated.getImageUrl()    != null) product.setImageUrl(updated.getImageUrl());
        if (updated.getImageUrls()   != null) {
            product.getImageUrls().clear();
            product.getImageUrls().addAll(updated.getImageUrls());
        }
        if (updated.getDescription() != null) product.setDescription(updated.getDescription());
        if (updated.getIsActive()    != null) product.setIsActive(updated.getIsActive());
        
        if (updated.getVariants() != null) {
            if (product.getVariants() != null) {
                product.getVariants().clear();
            } else {
                product.setVariants(new java.util.ArrayList<>());
            }
            for (com.redavo.pos.model.ProductVariant v : updated.getVariants()) {
                v.setProduct(product); // Ensure parent reference is set
                product.getVariants().add(v);
            }
        }
        
        product.computeStockStatus();
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findByStockQuantityLessThanEqual(5);
    }
}
