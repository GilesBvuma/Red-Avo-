package com.redavo.pos.controller;

import com.redavo.pos.dto.ReviewDto;
import com.redavo.pos.dto.ReviewSummaryDto;
import com.redavo.pos.model.Review;
import com.redavo.pos.repository.ReviewRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping("/{productId}/reviews")
    public ResponseEntity<List<Review>> getProductReviews(@PathVariable Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(productId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/{productId}/reviews/summary")
    public ResponseEntity<ReviewSummaryDto> getReviewSummary(@PathVariable Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(productId);
        long count = reviews.size();
        double avg = count > 0 ? reviews.stream().mapToInt(Review::getRating).average().orElse(0.0) : 0.0;
        
        return ResponseEntity.ok(new ReviewSummaryDto(count, Math.round(avg * 10.0) / 10.0));
    }

    @PostMapping("/{productId}/reviews")
    public ResponseEntity<Review> submitReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewDto request) {
        
        Review review = new Review();
        review.setProductId(productId);
        review.setRating(request.getRating());
        review.setReviewerName(request.getReviewerName());
        review.setComment(request.getComment());
        review.setIsApproved(false); // Default to false for moderation
        
        Review saved = reviewRepository.save(review);
        return ResponseEntity.ok(saved);
    }
}
