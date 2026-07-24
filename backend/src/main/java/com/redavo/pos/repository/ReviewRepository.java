package com.redavo.pos.repository;

import com.redavo.pos.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(Long productId);
    long countByProductIdAndIsApprovedTrue(Long productId);
    List<Review> findByIsApprovedFalseOrderByCreatedAtDesc();
    List<Review> findAllByOrderByCreatedAtDesc();
}
