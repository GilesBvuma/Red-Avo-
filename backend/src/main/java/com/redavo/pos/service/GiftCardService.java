package com.redavo.pos.service;

import com.redavo.pos.dto.GiftCardPurchaseRequest;
import com.redavo.pos.dto.GiftCardRedeemRequest;
import com.redavo.pos.model.GiftCard;
import com.redavo.pos.model.GiftCardLedger;
import com.redavo.pos.repository.GiftCardLedgerRepository;
import com.redavo.pos.repository.GiftCardRepository;
import com.redavo.pos.repository.GiftCardTierRepository;
import com.redavo.pos.model.GiftCardTier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class GiftCardService {

    // Cards over this value are held for fraud review before email delivery
    private static final BigDecimal FRAUD_HOLD_THRESHOLD = new BigDecimal("50.00");
    private static final int FRAUD_HOLD_MINUTES = 30;

    private final GiftCardRepository giftCardRepo;
    private final GiftCardLedgerRepository ledgerRepo;
    private final GiftCardTierRepository tierRepo;
    private final NotificationService notificationService;

    private final SecureRandom secureRandom = new SecureRandom();
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1

    public GiftCardService(GiftCardRepository giftCardRepo,
                           GiftCardLedgerRepository ledgerRepo,
                           GiftCardTierRepository tierRepo,
                           NotificationService notificationService) {
        this.giftCardRepo = giftCardRepo;
        this.ledgerRepo = ledgerRepo;
        this.tierRepo = tierRepo;
        this.notificationService = notificationService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tiers
    // ─────────────────────────────────────────────────────────────────────────

    public List<GiftCardTier> getAllTiers() {
        return tierRepo.findAllByOrderByTierLevelAsc();
    }

    @Transactional
    public GiftCardTier updateTier(Integer id, String name, BigDecimal priceAmount, String imageUrl) {
        GiftCardTier tier = tierRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tier not found"));
        tier.setName(name);
        tier.setPriceAmount(priceAmount);
        
        // If the API explicitly passes an empty string for the image, clear it out.
        // Otherwise set it to the provided non-null value (allowing null to mean "don't change it" if we wanted, 
        // but it's cleaner to just accept whatever is passed from the controller).
        tier.setImageUrl(imageUrl);
        
        return tierRepo.save(tier);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Code generation
    // ─────────────────────────────────────────────────────────────────────────

    private String generateCode() {
        // Format: GC-XXXX-XXXX-XXXX
        String code;
        do {
            code = "GC-" + randomSegment() + "-" + randomSegment() + "-" + randomSegment();
        } while (giftCardRepo.findByCode(code).isPresent()); // ensure uniqueness
        return code;
    }

    private String randomSegment() {
        StringBuilder sb = new StringBuilder(4);
        for (int i = 0; i < 4; i++) {
            sb.append(CODE_CHARS.charAt(secureRandom.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Purchase
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public GiftCard purchaseGiftCard(GiftCardPurchaseRequest req) {
        if (req.getTierId() == null) {
            throw new IllegalArgumentException("Tier ID is required");
        }

        GiftCardTier tier = tierRepo.findById(req.getTierId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid tier ID"));

        BigDecimal amount = tier.getPriceAmount();

        GiftCard card = new GiftCard();
        card.setCode(generateCode());
        card.setInitialBalance(amount);
        card.setRemainingBalance(amount);
        card.setTierName(tier.getName());
        card.setImageUrl(tier.getImageUrl());
        card.setPurchaserEmail(req.getPurchaserEmail());
        card.setPurchaserName(req.getPurchaserName());
        card.setRecipientEmail(req.getRecipientEmail());
        card.setRecipientName(req.getRecipientName());
        card.setPersonalMessage(req.getPersonalMessage());
        card.setRecipientBirthday(req.getRecipientBirthday());
        card.setExpiresAt(null); // Never expires

        boolean holdForFraud = amount.compareTo(FRAUD_HOLD_THRESHOLD) > 0;
        if (holdForFraud) {
            card.setDeliveryHeld(true);
            card.setReleaseAt(LocalDateTime.now().plusMinutes(FRAUD_HOLD_MINUTES));
            card.setStatus("PENDING");
            card.setDelivered(false);
        } else {
            card.setDeliveryHeld(false);
            card.setReleaseAt(null);
            card.setStatus("ACTIVE");
        }

        GiftCard saved = giftCardRepo.save(card);

        // Send immediately for low-value cards
        if (!holdForFraud) {
            deliverCard(saved);
        }

        return saved;
    }

    // Internal — sends the gift card email and marks as delivered
    private void deliverCard(GiftCard card) {
        try {
            notificationService.sendGiftCardEmail(
                card.getRecipientName(),
                card.getRecipientEmail(),
                card.getCode(),
                card.getInitialBalance(),
                card.getPersonalMessage(),
                card.getPurchaserName(),
                card.getImageUrl()
            );
            card.setDelivered(true);
            card.setDeliveryHeld(false);
            card.setStatus("ACTIVE");
            giftCardRepo.save(card);
        } catch (Exception e) {
            System.err.println("Failed to send gift card email for " + card.getCode() + ": " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scheduled: auto-release held cards every 60 seconds
    // ─────────────────────────────────────────────────────────────────────────

    @Scheduled(fixedRate = 60_000)
    public void releaseHeldCards() {
        List<GiftCard> toRelease = giftCardRepo.findByDeliveryHeldTrueAndReleaseAtBefore(LocalDateTime.now());
        for (GiftCard card : toRelease) {
            deliverCard(card);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scheduled: birthday reminders — runs daily at 09:00
    // ─────────────────────────────────────────────────────────────────────────

    @Scheduled(cron = "0 0 9 * * *")
    public void sendBirthdayReminders() {
        String today = LocalDate.now().toString(); // "YYYY-MM-DD"
        List<GiftCard> cards = giftCardRepo.findActiveCardsWithBirthdayToday(today);
        for (GiftCard card : cards) {
            try {
                notificationService.sendGiftCardBirthdayReminder(
                    card.getRecipientName(),
                    card.getRecipientEmail(),
                    card.getRemainingBalance(),
                    card.getCode()
                );
            } catch (Exception e) {
                System.err.println("Birthday reminder failed for " + card.getCode() + ": " + e.getMessage());
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Validate (public — for checkout preview)
    // ─────────────────────────────────────────────────────────────────────────

    public Map<String, Object> validateCard(String code) {
        return giftCardRepo.findByCode(code.toUpperCase().trim())
            .map(card -> Map.<String, Object>of(
                "valid", "ACTIVE".equals(card.getStatus()),
                "status", card.getStatus(),
                "remainingBalance", card.getRemainingBalance(),
                "held", card.getDeliveryHeld()
            ))
            .orElse(Map.of("valid", false, "status", "NOT_FOUND", "remainingBalance", BigDecimal.ZERO));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Redeem (transactional — called from checkout/order flow)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> redeemPartial(GiftCardRedeemRequest req) {
        GiftCard card = giftCardRepo.findByCode(req.getCode().toUpperCase().trim())
            .orElseThrow(() -> new IllegalArgumentException("Gift card not found"));

        if (!"ACTIVE".equals(card.getStatus())) {
            throw new IllegalArgumentException("Gift card is not active. Status: " + card.getStatus());
        }
        if (card.getRemainingBalance().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Gift card has no remaining balance");
        }

        // Can't redeem more than remaining balance
        BigDecimal toApply = req.getAmountToRedeem().min(card.getRemainingBalance());
        BigDecimal newBalance = card.getRemainingBalance().subtract(toApply);

        // Write ledger entry
        GiftCardLedger entry = new GiftCardLedger();
        entry.setGiftCardId(card.getId());
        entry.setAmountUsed(toApply);
        entry.setBalanceAfter(newBalance);
        entry.setOrderId(req.getOrderId());
        ledgerRepo.save(entry);

        // Update card balance and status
        card.setRemainingBalance(newBalance);
        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            card.setStatus("REDEEMED");
        }
        giftCardRepo.save(card);

        return Map.of(
            "amountApplied", toApply,
            "remainingBalance", newBalance,
            "fullyRedeemed", "REDEEMED".equals(card.getStatus())
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin operations
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public GiftCard voidCard(Long id) {
        GiftCard card = giftCardRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Gift card not found"));
        card.setStatus("VOIDED");
        return giftCardRepo.save(card);
    }

    @Transactional
    public GiftCard releaseNow(Long id) {
        GiftCard card = giftCardRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Gift card not found"));
        if ("PENDING".equals(card.getStatus())) {
            deliverCard(card);
        }
        return card;
    }

    public List<GiftCard> getAllCards() {
        return giftCardRepo.findAll();
    }

    public List<GiftCardLedger> getLedger(Long giftCardId) {
        return ledgerRepo.findByGiftCardIdOrderByRedeemedAtDesc(giftCardId);
    }
}
