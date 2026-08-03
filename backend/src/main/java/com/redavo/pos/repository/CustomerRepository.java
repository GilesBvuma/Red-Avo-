package com.redavo.pos.repository;

import com.redavo.pos.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findByWhatsappOptInTrue();
    List<Customer> findByTotalPurchasesGreaterThanEqual(int count);
    List<Customer> findByCreatedAtAfter(LocalDateTime date);

    // For deduplication on order creation
    java.util.Optional<Customer> findByEmail(String email);
    java.util.Optional<Customer> findByPhoneNumber(String phoneNumber);
}
