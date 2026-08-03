package com.redavo.pos.repository;

import com.redavo.pos.model.GiftCardLedger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GiftCardLedgerRepository extends JpaRepository<GiftCardLedger, Long> {
    List<GiftCardLedger> findByGiftCardIdOrderByRedeemedAtDesc(Long giftCardId);
}
