package com.redavo.pos.controller;

import com.redavo.pos.model.NotificationLog;
import com.redavo.pos.service.BulkNotificationService;
import com.redavo.pos.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notify")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private BulkNotificationService bulkNotificationService;

    @PostMapping("/test-email")
    public ResponseEntity<Map<String, String>> testEmail(@RequestBody Map<String, Object> body) {
        String toEmail   = (String) body.getOrDefault("email", "");
        String subject   = "Red Avo POS — Email Test ✅";
        String message   = "This is a test email from your Red Avo POS system.\n\n"
                + "If you're reading this, email is working correctly! 🥑❤️\n\n"
                + "— Red Avo POS";
        notificationService.sendEmail(null, "Test", toEmail, message, subject, "TEST-EMAIL", null);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Test email dispatched to " + toEmail));
    }

    @PostMapping("/email")
    public ResponseEntity<Map<String, String>> sendEmail(@RequestBody Map<String, Object> body) {
        Long customerId  = body.get("customerId") != null ? Long.valueOf(body.get("customerId").toString()) : null;
        String customerName = (String) body.getOrDefault("customerName", "");
        String email        = (String) body.getOrDefault("email", "");
        String message      = (String) body.getOrDefault("message", "");
        String subject      = (String) body.getOrDefault("subject", "Message from Red Avo");
        String orderRef     = (String) body.getOrDefault("orderRef", "");

        notificationService.sendEmail(customerId, customerName, email, message, subject, orderRef, null);
        return ResponseEntity.ok(Map.of("status", "ok", "channel", "EMAIL"));
    }

    @PostMapping("/whatsapp")
    public ResponseEntity<Map<String, String>> sendWhatsApp(@RequestBody Map<String, Object> body) {
        Long customerId  = body.get("customerId") != null ? Long.valueOf(body.get("customerId").toString()) : null;
        String customerName = (String) body.getOrDefault("customerName", "");
        String phone        = (String) body.getOrDefault("phone", "");
        String message      = (String) body.getOrDefault("message", "");
        String orderRef     = (String) body.getOrDefault("orderRef", "");

        notificationService.sendWhatsApp(customerId, customerName, phone, message, orderRef);
        return ResponseEntity.ok(Map.of("status", "ok", "channel", "WHATSAPP"));
    }

    @PostMapping("/sms")
    public ResponseEntity<Map<String, String>> sendSms(@RequestBody Map<String, Object> body) {
        Long customerId  = body.get("customerId") != null ? Long.valueOf(body.get("customerId").toString()) : null;
        String customerName = (String) body.getOrDefault("customerName", "");
        String phone        = (String) body.getOrDefault("phone", "");
        String message      = (String) body.getOrDefault("message", "");
        String orderRef     = (String) body.getOrDefault("orderRef", "");

        notificationService.sendSms(customerId, customerName, phone, message, orderRef);
        return ResponseEntity.ok(Map.of("status", "ok", "channel", "SMS"));
    }

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkSend(@RequestBody Map<String, String> body) {
        String segment  = body.getOrDefault("segment", "ALL_CUSTOMERS");
        String type     = body.getOrDefault("type", "EMAIL");
        String message  = body.getOrDefault("message", "");

        Map<String, Object> result = bulkNotificationService.bulkSend(segment, type, message);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<List<NotificationLog>> getHistory() {
        return ResponseEntity.ok(notificationService.getNotificationHistory());
    }
}
