package com.redavo.pos.repository;

import com.redavo.pos.model.GiftCardTier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GiftCardTierRepository extends JpaRepository<GiftCardTier, Integer> {
    List<GiftCardTier> findAllByOrderByTierLevelAsc();
}
