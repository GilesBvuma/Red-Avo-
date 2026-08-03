package com.redavo.pos.controller;

import com.redavo.pos.dto.ContactMessageDto;
import com.redavo.pos.model.ContactMessage;
import com.redavo.pos.repository.ContactMessageRepository;
import com.redavo.pos.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ContactController {

    @Autowired
    private ContactMessageRepository contactRepository;

    @Autowired
    private NotificationService notificationService;

    // Public endpoint for storefront contact form
    @PostMapping("/contact")
    public ResponseEntity<Map<String, Object>> submitContactForm(@Valid @RequestBody ContactMessageDto request) {
        ContactMessage msg = new ContactMessage();
        msg.setName(request.getName());
        msg.setEmail(request.getEmail());
        msg.setMessage(request.getMessage());
        
        contactRepository.save(msg);

        // Send email to admin
        try {
            notificationService.sendAdminContactEmail(request.getName(), request.getEmail(), request.getMessage());
        } catch (Exception e) {
            // Log it but still return success to user since message was saved
            System.err.println("Failed to send admin contact email: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Message received"));
    }

    // Protected endpoint for POS app to read messages
    @GetMapping("/admin/contact")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ContactMessage>> getContactMessages() {
        return ResponseEntity.ok(contactRepository.findAllByOrderByCreatedAtDesc());
    }

    // Mark message as read
    @PostMapping("/admin/contact/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ContactMessage> markAsRead(@PathVariable Long id) {
        return contactRepository.findById(id).map(msg -> {
            msg.setIsRead(true);
            return ResponseEntity.ok(contactRepository.save(msg));
        }).orElse(ResponseEntity.notFound().build());
    }
}
