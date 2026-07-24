'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import styles from './ProductReviews.module.css';

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [rating, setRating] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/products/${productId}/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess(false);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, reviewerName, comment }),
      });

      if (!res.ok) throw new Error('Failed to submit review');
      
      setSubmitSuccess(true);
      setReviewerName('');
      setComment('');
      setRating(5);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.reviewsContainer}>
      <h3 className={styles.title}>Customer Reviews</h3>

      <div className={styles.reviewList}>
        {loading ? (
          <p className={styles.text}>Loading reviews...</p>
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review.id} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <span className={styles.reviewerName}>{review.reviewerName}</span>
                <span className={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.stars}>
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
              <p className={styles.reviewComment}>{review.comment}</p>
            </div>
          ))
        ) : (
          <p className={styles.text}>No reviews yet. Be the first to review!</p>
        )}
      </div>

      <div className={styles.formContainer}>
        <h4 className={styles.formTitle}>Write a Review</h4>
        {submitSuccess ? (
          <div className={styles.successMessage}>
            Thank you! Your review has been submitted and is pending approval.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Rating</label>
              <div className={styles.ratingInput}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.starBtn} ${rating >= star ? styles.activeStar : ''}`}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="reviewerName">Name</label>
              <input
                id="reviewerName"
                type="text"
                required
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
                className={styles.input}
                placeholder="Your name"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="comment">Review</label>
              <textarea
                id="comment"
                required
                value={comment}
                onChange={e => setComment(e.target.value)}
                className={styles.textarea}
                placeholder="What did you think about this product?"
                rows={4}
              />
            </div>
            {error && <p className={styles.errorText}>{error}</p>}
            <button type="submit" disabled={submitting} className={styles.submitBtn}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
