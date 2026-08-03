package com.redavo.pos.controller;

import com.redavo.pos.dto.ImportResultDTO;
import com.redavo.pos.model.Customer;
import com.redavo.pos.repository.CustomerRepository;
import com.redavo.pos.service.CustomerExcelImportService;
import com.redavo.pos.service.NotificationService;
import com.redavo.pos.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired private CustomerRepository customerRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private CustomerExcelImportService customerExcelImportService;
    @Autowired private OtpService otpService;

    // ── IMPORT from Excel ──────────────────────────────────────────
    @PostMapping(value = "/import", consumes = "multipart/form-data")
    public ResponseEntity<ImportResultDTO> importExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(
                ImportResultDTO.builder().status("FAILED").filename(file.getOriginalFilename())
                    .errors(List.of("Uploaded file is empty.")).build());
        }
        String ext = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!ext.endsWith(".xlsx") && !ext.endsWith(".xls")) {
            return ResponseEntity.badRequest().body(
                ImportResultDTO.builder().status("FAILED").filename(file.getOriginalFilename())
                    .errors(List.of("Only .xlsx and .xls files are accepted.")).build());
        }
        ImportResultDTO result = customerExcelImportService.importFile(file);
        return ResponseEntity.ok(result);
    }

    // ── OTP Authentication for Customers ───────────────────────────
    @PostMapping("/auth/otp/send")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        
        try {
            otpService.generateAndSendOtp(email.trim().toLowerCase());
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to send OTP"));
        }
    }

    @PostMapping("/auth/otp/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required"));
        }
        
        email = email.trim().toLowerCase();
        boolean isValid = otpService.validateOtp(email, otp);
        if (!isValid) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired OTP"));
        }
        
        // OTP is valid. Check if customer exists.
        var existingCustomer = customerRepository.findByEmail(email);
        if (existingCustomer.isPresent()) {
            return ResponseEntity.ok(Map.of("exists", true, "customer", existingCustomer.get()));
        } else {
            return ResponseEntity.ok(Map.of("exists", false));
        }
    }

    // ── GET all customers ──────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerRepository.findAll());
    }

    // ── CREATE customer (with duplicate guard by email) ────────────
    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Customer customer) {
        // Guard: don't create if email already exists
        if (customer.getEmail() != null && !customer.getEmail().isBlank()) {
            var existing = customerRepository.findByEmail(customer.getEmail().trim().toLowerCase());
            if (existing.isPresent()) {
                return ResponseEntity.status(409)
                        .body(Map.of("error", "A customer with this email already exists", "id", existing.get().getId()));
            }
        }
        customer.setEmail(customer.getEmail() != null ? customer.getEmail().trim().toLowerCase() : null);
        return ResponseEntity.ok(customerRepository.save(customer));
    }

    // ── UPDATE customer ────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Long id, @RequestBody Customer updated) {
        return customerRepository.findById(id).map(c -> {
            if (updated.getFirstName()    != null) c.setFirstName(updated.getFirstName());
            if (updated.getLastName()     != null) c.setLastName(updated.getLastName());
            if (updated.getPhoneNumber()  != null) c.setPhoneNumber(updated.getPhoneNumber());
            if (updated.getAddress()      != null) c.setAddress(updated.getAddress());
            if (updated.getNotes()        != null) c.setNotes(updated.getNotes());
            if (updated.getWhatsappOptIn() != null) c.setWhatsappOptIn(updated.getWhatsappOptIn());
            if (updated.getIsActive()     != null) c.setIsActive(updated.getIsActive());
            // Email change — check uniqueness first
            if (updated.getEmail() != null && !updated.getEmail().equalsIgnoreCase(c.getEmail())) {
                String newEmail = updated.getEmail().trim().toLowerCase();
                boolean taken = customerRepository.findByEmail(newEmail)
                        .filter(found -> !found.getId().equals(id))
                        .isPresent();
                if (taken) {
                    return ResponseEntity.status(409)
                            .<Object>body(Map.of("error", "Email already in use by another customer"));
                }
                c.setEmail(newEmail);
            }
            return ResponseEntity.<Object>ok(customerRepository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── DELETE customer ────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        customerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── BULK EMAIL ─────────────────────────────────────────────────
    // Body: { segment: "ALL" | "WHATSAPP_OPTIN" | "THREE_PLUS_PURCHASES",
    //         subject: "...", message: "..." }
    @PostMapping("/bulk-email")
    public ResponseEntity<Map<String, Object>> sendBulkEmail(@RequestBody Map<String, String> body) {
        String segment  = body.getOrDefault("segment", "ALL");
        String subject  = body.getOrDefault("subject", "Message from Red Avo");
        String template = body.getOrDefault("message", "");

        List<Customer> targets = switch (segment) {
            case "WHATSAPP_OPTIN"       -> customerRepository.findByWhatsappOptInTrue();
            case "THREE_PLUS_PURCHASES" -> customerRepository.findByTotalPurchasesGreaterThanEqual(3);
            default                     -> customerRepository.findAll();
        };

        int sent = 0, failed = 0;
        for (Customer c : targets) {
            if (c.getEmail() == null || c.getEmail().isBlank()) { failed++; continue; }
            String firstName = c.getFirstName() != null ? c.getFirstName() : "Valued Customer";
            String personalised = template.replace("[FirstName]", firstName)
                                          .replace("[Name]", firstName);
            try {
                notificationService.sendEmail(
                        c.getId(), firstName, c.getEmail(),
                        personalised, subject, "BULK-" + System.currentTimeMillis(), null);
                sent++;
            } catch (Exception e) {
                failed++;
            }
        }

        return ResponseEntity.ok(Map.of(
                "total",  targets.size(),
                "sent",   sent,
                "failed", failed,
                "segment", segment
        ));
    }
}
