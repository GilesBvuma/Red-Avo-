package com.redavo.pos.repository;

import com.redavo.pos.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByIsActiveTrue();

    List<Product> findByCategoryAndIsActiveTrue(String category);

    List<Product> findByCategoryIgnoreCase(String category);

    List<Product> findByStockQuantityLessThanEqualAndIsActiveTrue(int qty);
}
