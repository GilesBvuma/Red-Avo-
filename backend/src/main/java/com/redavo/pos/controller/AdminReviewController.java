package com.redavo.pos.controller;

import com.redavo.pos.model.Review;
import com.redavo.pos.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reviews")
public class AdminReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping
    public ResponseEntity<List<Review>> getAllReviews(@RequestParam(required = false) Boolean pendingOnly) {
        if (Boolean.TRUE.equals(pendingOnly)) {
            return ResponseEntity.ok(reviewRepository.findByIsApprovedFalseOrderByCreatedAtDesc());
        }
        return ResponseEntity.ok(reviewRepository.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Review> approveReview(@PathVariable Long id) {
        return reviewRepository.findById(id).map(review -> {
            review.setIsApproved(true);
            return ResponseEntity.ok(reviewRepository.save(review));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        if (reviewRepository.existsById(id)) {
            reviewRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
