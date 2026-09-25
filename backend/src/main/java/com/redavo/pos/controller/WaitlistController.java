package com.redavo.pos.controller;

import com.redavo.pos.model.WaitlistEntry;
import com.redavo.pos.repository.WaitlistRepository;
import com.redavo.pos.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * WaitlistController
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/waitlist          — public; saves entry + sends confirmation email
 * GET  /api/waitlist          — ADMIN/MANAGER only; returns all entries
 * GET  /api/waitlist/count    — ADMIN/MANAGER only; returns count
 */
@RestController
@RequestMapping("/api/waitlist")
public class WaitlistController {

    @Autowired private WaitlistRepository waitlistRepo;
    @Autowired private NotificationService notificationService;

    /** Public sign-up endpoint — called by the storefront waitlist page. */
    @PostMapping
    public ResponseEntity<Map<String, String>> join(@RequestBody Map<String, String> body) {
        String email    = (body.getOrDefault("email", "")).trim().toLowerCase();
        String name     = (body.getOrDefault("name",  "")).trim();
        String phone    = (body.getOrDefault("phone",  "")).trim();
        String interest = (body.getOrDefault("interest", "")).trim();

        if (email.isBlank() || name.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "error", "message", "name and email are required"));
        }

        if (waitlistRepo.existsByEmail(email)) {
            // Idempotent — already on the list; return success so UX stays clean
            return ResponseEntity.ok(Map.of("status", "already_joined",
                    "message", "You're already on the waitlist!"));
        }

        WaitlistEntry entry = new WaitlistEntry();
        entry.setName(name);
        entry.setEmail(email);
        entry.setPhone(phone.isBlank() ? null : phone);
        entry.setInterest(interest.isBlank() ? null : interest);
        entry.setSource("STOREFRONT");
        waitlistRepo.save(entry);

        // Send confirmation email (async-safe — NotificationService handles errors)
        String firstName = name.contains(" ") ? name.split(" ")[0] : name;
        String confirmBody = "Hi " + firstName + "!\n\n"
                + "You're on the RedAvo waitlist. We'll notify you first when the next drop goes live.\n\n"
                + "Authentic. Fearless.\n— The RedAvo Team";
        notificationService.sendEmail(null, firstName, email, confirmBody,
                "You're on the RedAvo waitlist 🥑", "WAITLIST", null);

        System.out.println("[WAITLIST ✅] New entry: " + email);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "You're on the list!"));
    }

    /** Admin-only: retrieve all waitlist entries, newest first. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<List<WaitlistEntry>> getAll() {
        return ResponseEntity.ok(waitlistRepo.findAll());
    }

    /** Admin-only: total count. */
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Map<String, Long>> count() {
        return ResponseEntity.ok(Map.of("count", waitlistRepo.count()));
    }
}
