package com.redavo.pos.service;

import com.redavo.pos.model.Customer;
import com.redavo.pos.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BulkNotificationService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private NotificationService notificationService;

    /**
     * Sends a bulk notification to a segment of customers.
     *
     * @param segment         ALL_CUSTOMERS | WHATSAPP_OPTIN | LAST_30_DAYS | THREE_PLUS_PURCHASES
     * @param type            EMAIL | SMS | WHATSAPP
     * @param messageTemplate Message body, may contain [FirstName] placeholder
     * @return Map with keys: sent, failed, total
     */
    public Map<String, Object> bulkSend(String segment, String type, String messageTemplate) {
        List<Customer> customers = resolveSegment(segment);

        int sent = 0;
        int failed = 0;

        for (Customer customer : customers) {
            String firstName = customer.getFirstName() != null ? customer.getFirstName() : "Customer";
            String personalisedMessage = messageTemplate.replace("[FirstName]", firstName);
            String customerName = firstName + " " + (customer.getLastName() != null ? customer.getLastName() : "");
            String orderRef = "BULK-" + segment;

            try {
                switch (type.toUpperCase()) {
                    case "EMAIL" -> {
                        if (customer.getEmail() != null && !customer.getEmail().isBlank()) {
                            notificationService.sendEmail(
                                    customer.getId(),
                                    customerName.trim(),
                                    customer.getEmail(),
                                    personalisedMessage,
                                    "Message from Red Avo",
                                    orderRef,
                                    null
                            );
                            sent++;
                        } else {
                            failed++;
                        }
                    }
                    case "SMS" -> {
                        if (customer.getPhoneNumber() != null && !customer.getPhoneNumber().isBlank()) {
                            notificationService.sendSms(
                                    customer.getId(),
                                    customerName.trim(),
                                    customer.getPhoneNumber(),
                                    personalisedMessage,
                                    orderRef
                            );
                            sent++;
                        } else {
                            failed++;
                        }
                    }
                    case "WHATSAPP" -> {
                        if (customer.getPhoneNumber() != null && !customer.getPhoneNumber().isBlank()) {
                            notificationService.sendWhatsApp(
                                    customer.getId(),
                                    customerName.trim(),
                                    customer.getPhoneNumber(),
                                    personalisedMessage,
                                    orderRef
                            );
                            sent++;
                        } else {
                            failed++;
                        }
                    }
                    default -> failed++;
                }
            } catch (Exception e) {
                System.err.println("[BULK] Failed to send to customer " + customer.getId() + ": " + e.getMessage());
                failed++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("sent", sent);
        result.put("failed", failed);
        result.put("total", customers.size());
        return result;
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private List<Customer> resolveSegment(String segment) {
        return switch (segment.toUpperCase()) {
            case "ALL_CUSTOMERS"        -> customerRepository.findAll();
            case "WHATSAPP_OPTIN"       -> customerRepository.findByWhatsappOptInTrue();
            case "LAST_30_DAYS"         -> customerRepository.findByCreatedAtAfter(
                    LocalDate.now().minusDays(30).atStartOfDay());
            case "THREE_PLUS_PURCHASES" -> customerRepository.findByTotalPurchasesGreaterThanEqual(3);
            default                     -> customerRepository.findAll();
        };
    }
}
