package com.redavo.pos.repository;

import com.redavo.pos.model.ProductCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<ProductCollection, Long> {

    List<ProductCollection> findAllByIsActiveTrueOrderBySortOrderAsc();

    Optional<ProductCollection> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
