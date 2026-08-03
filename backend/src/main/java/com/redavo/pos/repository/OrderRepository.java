package com.redavo.pos.repository;

import com.redavo.pos.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCreatedAtAfter(LocalDateTime date);

    @Query("SELECT COALESCE(SUM(o.total), 0.0) FROM Order o WHERE o.storeId = :storeId AND o.createdAt BETWEEN :from AND :to AND o.status = 'COMPLETED'")
    Double sumTotalByStoreAndPeriod(@Param("storeId") Long storeId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(o.costOfSale), 0.0) FROM Order o WHERE o.storeId = :storeId AND o.createdAt BETWEEN :from AND :to AND o.status = 'COMPLETED'")
    Double sumCogsByStoreAndPeriod(@Param("storeId") Long storeId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.storeId = :storeId AND o.createdAt BETWEEN :from AND :to AND o.status = 'COMPLETED'")
    Long countOrdersByStoreAndPeriod(@Param("storeId") Long storeId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.userId = :userId AND o.status = 'COMPLETED'")
    Long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(o.total), 0.0) FROM Order o WHERE o.userId = :userId AND o.status = 'COMPLETED'")
    Double sumTotalByUserId(@Param("userId") Long userId);

    // Employee specific period queries
    @Query("SELECT COUNT(o) FROM Order o WHERE o.userId = :userId AND o.createdAt BETWEEN :from AND :to AND o.status = 'COMPLETED'")
    Long countOrdersByUserIdAndPeriod(@Param("userId") Long userId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(o.total), 0.0) FROM Order o WHERE o.userId = :userId AND o.createdAt BETWEEN :from AND :to AND o.status = 'COMPLETED'")
    Double sumTotalByUserIdAndPeriod(@Param("userId") Long userId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<Order> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    // Store Leaderboard (native or JPQL) - We will use a List of Object[] since Spring Data JPA can map to Object[] (Name, Sales)
    @Query("SELECT o.customerName, SUM(o.total) as totalSales FROM Order o WHERE o.storeId = :storeId AND o.status = 'COMPLETED' GROUP BY o.customerName ORDER BY totalSales DESC")
    List<Object[]> getTopCustomersByStore(@Param("storeId") Long storeId);

    // Leaderboard by User ID
    @Query("SELECT o.userId, SUM(o.total) as totalSales FROM Order o WHERE o.storeId = :storeId AND o.status = 'COMPLETED' GROUP BY o.userId ORDER BY totalSales DESC")
    List<Object[]> getEmployeeLeaderboardByStore(@Param("storeId") Long storeId);
}
