package com.redavo.pos.repository;

import com.redavo.pos.model.GiftCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GiftCardRepository extends JpaRepository<GiftCard, Long> {

    Optional<GiftCard> findByCode(String code);

    List<GiftCard> findByRecipientEmail(String email);

    // Find held cards whose release window has passed — for the scheduler
    List<GiftCard> findByDeliveryHeldTrueAndReleaseAtBefore(LocalDateTime now);

    // Find active cards where recipient birthday matches today (month + day)
    // Uses a native query because LocalDate month/day extraction is DB-specific
    @org.springframework.data.jpa.repository.Query(
        value = "SELECT * FROM gift_cards WHERE " +
                "EXTRACT(MONTH FROM recipient_birthday) = EXTRACT(MONTH FROM CAST(:today AS DATE)) AND " +
                "EXTRACT(DAY FROM recipient_birthday) = EXTRACT(DAY FROM CAST(:today AS DATE)) AND " +
                "status = 'ACTIVE' AND remaining_balance > 0",
        nativeQuery = true
    )
    List<GiftCard> findActiveCardsWithBirthdayToday(
        @org.springframework.data.repository.query.Param("today") String today
    );
}
