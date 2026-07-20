package com.redavo.pos.service;

import com.redavo.pos.config.MetaWhatsAppConfig;
import com.redavo.pos.model.NotificationLog;
import com.redavo.pos.repository.NotificationLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.io.ByteArrayResource;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * NotificationService
 * ─────────────────────────────────────────────────────────────────
 *  EMAIL    → Gmail SMTP via JavaMailSender (Spring Boot Mail)
 *  WHATSAPP → Meta WhatsApp Cloud API (free, graph.facebook.com)
 *  SMS      → Demo mode (can be wired to Twilio/Africa's Talking later)
 *
 *  Each channel independently falls back to DEMO mode when not configured.
 *  DEMO = logs to console + saves a DEMO record in notification_log table.
 */
@Service
public class NotificationService {

    @Autowired private JavaMailSender         mailSender;
    @Autowired private MetaWhatsAppConfig     metaConfig;
    @Autowired private RestTemplate           restTemplate;
    @Autowired private NotificationLogRepository notificationLogRepo;

    @Value("${notification.demo.mode:true}")
    private boolean demoMode;

    @Value("${spring.mail.username}")
    private String fromAddress;

    // ─── Twilio SMS API ───
    @Value("${twilio.account.sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth.token:}")
    private String twilioAuthToken;

    @Value("${twilio.phone.number:}")
    private String twilioPhoneNumber;

    @Value("${twilio.enabled:false}")
    private boolean twilioEnabled;

    // ═══════════════════════════════════════════════════════════
    //  📧  EMAIL — Gmail SMTP
    // ═══════════════════════════════════════════════════════════

    public void sendEmail(Long customerId, String customerName,
                          String email, String body, String subject, String orderRef, byte[] attachmentPdf) {
        if (demoMode) {
            printDemo("EMAIL", email, subject, body);
            saveLog(customerId, customerName, email, "EMAIL", body, "DEMO", orderRef);
            return;
        }
        if (email == null || email.isBlank()) {
            System.err.println("[EMAIL ⚠️] Skipping — no email address provided");
            return;
        }
        try {
            boolean hasAttachment = (attachmentPdf != null && attachmentPdf.length > 0);
            MimeMessage message = mailSender.createMimeMessage();
            // Always multipart=true — required for setText(plain, html) even without attachments
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("Red Avo POS <" + fromAddress + ">");
            helper.setTo(email);
            helper.setSubject(subject);

            // Build an HTML version of the plain-text body for better inbox rendering
            String htmlBody = "<html><body style=\"font-family:Arial,sans-serif;font-size:14px;color:#1A1A1A;\">"
                    + "<div style=\"border-left:4px solid #C0392B;padding:0 0 0 16px;\">"
                    + body.replace("\n", "<br/>")
                    + "</div>"
                    + "<p style=\"font-size:11px;color:#9CA3AF;margin-top:24px;\">"
                    + "Red Avo Sportswear &mdash; Authentic &middot; Fearless<br/>"
                    + "This is an automated message from your POS system.</p>"
                    + "</body></html>";

            helper.setText(body, htmlBody);   // (plain, html) — inbox shows HTML, fallback to plain

            if (hasAttachment) {
                helper.addAttachment("Invoice_" + orderRef + ".pdf",
                        new ByteArrayResource(attachmentPdf),
                        "application/pdf");
            }

            mailSender.send(message);
            System.out.println("[EMAIL ✅] Sent → " + email + " | Subject: " + subject);
            saveLog(customerId, customerName, email, "EMAIL", body, "SENT", orderRef);

        } catch (jakarta.mail.MessagingException e) {
            System.err.println("[EMAIL ❌ MessagingException] " + email + " — " + e.getMessage());
            saveLog(customerId, customerName, email, "EMAIL", body, "FAILED", orderRef);
        } catch (org.springframework.mail.MailAuthenticationException e) {
            System.err.println("[EMAIL ❌ Auth failed] Check your Gmail App Password in application.properties — " + e.getMessage());
            saveLog(customerId, customerName, email, "EMAIL", body, "FAILED", orderRef);
        } catch (org.springframework.mail.MailSendException e) {
            System.err.println("[EMAIL ❌ Send failed] " + email + " — " + e.getMessage());
            saveLog(customerId, customerName, email, "EMAIL", body, "FAILED", orderRef);
        } catch (Exception e) {
            System.err.println("[EMAIL ❌] " + email + " — " + e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace();
            saveLog(customerId, customerName, email, "EMAIL", body, "FAILED", orderRef);
        }
    }

    public void sendOtpEmail(String email, String otp) {
        String subject = "Your Password Reset OTP";
        String body = "You requested a password reset. Your OTP is: " + otp + "\nThis OTP will expire in 15 minutes.";
        sendEmail(null, "User", email, body, subject, "AUTH_OTP", null);
    }

    // ═══════════════════════════════════════════════════════════
    //  💬  WHATSAPP — Meta Cloud API (graph.facebook.com)
    // ═══════════════════════════════════════════════════════════
    //
    //  HOW IT WORKS AT RUNTIME:
    //
    //  Case A — ORDER CONFIRMATIONS (free-form text):
    //    The customer just bought something so they are likely reachable.
    //    Meta allows free-form text when customer messaged you in last 24h
    //    OR when using sandbox test numbers.
    //    → This app sends free-form text. Works for: test numbers, and customers
    //      who have interacted with your WhatsApp number recently.
    //
    //  Case B — BULK MARKETING (to any opted-in customer):
    //    Must use a pre-approved Message Template.
    //    → This app sends free-form for now. See below to add template support.
    //    → For bulk to work reliably in production, create a template at:
    //      business.facebook.com → WhatsApp Manager → Message Templates
    //
    //  PHONE NUMBER FORMAT:
    //    Must be international format WITHOUT the + sign.
    //    Example: +263771234567 → 263771234567
    // ═══════════════════════════════════════════════════════════

    public void sendWhatsApp(Long customerId, String customerName,
                             String phone, String message, String orderRef) {
        if (!metaConfig.isConfigured()) {
            printDemo("WHATSAPP", phone, null, message);
            saveLog(customerId, customerName, phone, "WHATSAPP", message, "DEMO", orderRef);
            return;
        }

        // Sanitise phone: strip "+", spaces, dashes → Meta needs plain digits
        String to = phone.replaceAll("[^0-9]", "");

        // Build the JSON payload for Meta's messages endpoint
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("messaging_product", "whatsapp");
        payload.put("recipient_type",    "individual");
        payload.put("to",                to);
        payload.put("type",              "text");
        payload.put("text",              Map.of("preview_url", false, "body", message));

        sendToMetaApi(customerId, customerName, phone, message, orderRef, payload);
    }

    /**
     * sendWhatsAppTemplate — use for bulk marketing to reach any opted-in customer.
     * Template must be approved by Meta first (create at business.facebook.com).
     *
     * @param templateName   e.g. "redavo_order_confirm"
     * @param langCode       e.g. "en_US"
     * @param components     list of template variable components (can be null)
     */
    public void sendWhatsAppTemplate(Long customerId, String customerName,
                                     String phone, String templateName,
                                     String langCode, List<Map<String, Object>> components,
                                     String orderRef) {
        if (!metaConfig.isConfigured()) {
            printDemo("WHATSAPP_TEMPLATE", phone, templateName, "Template: " + templateName);
            saveLog(customerId, customerName, phone, "WHATSAPP", "Template: " + templateName, "DEMO", orderRef);
            return;
        }

        String to = phone.replaceAll("[^0-9]", "");

        Map<String, Object> template = new LinkedHashMap<>();
        template.put("name",     templateName);
        template.put("language", Map.of("code", langCode != null ? langCode : "en_US"));
        if (components != null && !components.isEmpty()) {
            template.put("components", components);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("messaging_product", "whatsapp");
        payload.put("to",                to);
        payload.put("type",              "template");
        payload.put("template",          template);

        sendToMetaApi(customerId, customerName, phone, "Template: " + templateName, orderRef, payload);
    }

    // ═══════════════════════════════════════════════════════════
    //  📱  SMS — Twilio Integration
    // ═══════════════════════════════════════════════════════════

    public void sendSms(Long customerId, String customerName,
                        String phone, String message, String orderRef) {
        if (demoMode || !twilioEnabled || twilioAccountSid == null || twilioAccountSid.isBlank()) {
            printDemo("SMS", phone, null, message);
            saveLog(customerId, customerName, phone, "SMS", message, "DEMO", orderRef);
            return;
        }

        try {
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(twilioAccountSid, twilioAuthToken);
            
            org.springframework.util.MultiValueMap<String, String> map = new org.springframework.util.LinkedMultiValueMap<>();
            map.add("To", phone);
            map.add("From", twilioPhoneNumber);
            map.add("Body", message);
            
            HttpEntity<org.springframework.util.MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("[SMS ✅ Twilio] Sent → " + phone);
                saveLog(customerId, customerName, phone, "SMS", message, "SENT", orderRef);
            } else {
                System.err.println("[SMS ❌ Twilio error] " + response.getBody());
                saveLog(customerId, customerName, phone, "SMS", message, "FAILED", orderRef);
            }
        } catch (Exception e) {
            System.err.println("[SMS ❌ Twilio Exception] " + e.getMessage());
            saveLog(customerId, customerName, phone, "SMS", message, "FAILED", orderRef);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  CHANNEL STATUS — returned to DashboardController
    // ═══════════════════════════════════════════════════════════

    public Map<String, String> getChannelStatus() {
        Map<String, String> status = new LinkedHashMap<>();
        status.put("email",    demoMode                  ? "DEMO" : "LIVE");
        status.put("whatsapp", metaConfig.isConfigured() ? "LIVE" : "DEMO");
        status.put("sms",      twilioEnabled             ? "LIVE" : "DEMO");
        return status;
    }

    // ═══════════════════════════════════════════════════════════
    //  QUERIES
    // ═══════════════════════════════════════════════════════════

    public List<NotificationLog> getNotificationHistory() {
        return notificationLogRepo.findAll();
    }

    public long getMessagesSentToday() {
        return notificationLogRepo.countBySentAtAfter(LocalDate.now().atStartOfDay());
    }

    // ═══════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════

    /**
     * Sends a pre-built payload to Meta's messages endpoint.
     * Handles auth header, error parsing, and log saving.
     */
    private void sendToMetaApi(Long customerId, String customerName,
                                String phone, String logMessage, String orderRef,
                                Map<String, Object> payload) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(metaConfig.getAccessToken());

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    metaConfig.getMessagesUrl(), request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("[WHATSAPP ✅] → " + phone + " | Response: " + response.getBody());
                saveLog(customerId, customerName, phone, "WHATSAPP", logMessage, "SENT", orderRef);
            } else {
                System.err.println("[WHATSAPP ⚠️] Non-2xx: " + response.getStatusCode() + " " + response.getBody());
                saveLog(customerId, customerName, phone, "WHATSAPP", logMessage, "FAILED", orderRef);
            }

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            // 4xx errors — log the Meta error response body (contains error code + message)
            String errBody = e.getResponseBodyAsString();
            System.err.println("[WHATSAPP ❌] " + phone + " — " + e.getStatusCode() + " → " + errBody);
            saveLog(customerId, customerName, phone, "WHATSAPP", logMessage, "FAILED", orderRef);

        } catch (Exception e) {
            System.err.println("[WHATSAPP ❌] " + phone + " — " + e.getMessage());
            saveLog(customerId, customerName, phone, "WHATSAPP", logMessage, "FAILED", orderRef);
        }
    }

    private void printDemo(String type, String contact, String subject, String message) {
        System.out.println("┌─ [DEMO " + type + "] ──────────────────────────────────");
        System.out.println("│  To      : " + contact);
        if (subject != null) System.out.println("│  Subject : " + subject);
        System.out.printf ("│  Message : %.120s%n", message);
        System.out.println("└──────────────────────────────────────────────────────────");
    }

    private void saveLog(Long customerId, String customerName, String contact,
                         String type, String message, String status, String orderRef) {
        NotificationLog log = new NotificationLog();
        log.setCustomerId(customerId);
        log.setCustomerName(customerName);
        log.setContact(contact);
        log.setType(type);
        log.setMessage(message);
        log.setStatus(status);
        log.setOrderReference(orderRef);
        notificationLogRepo.save(log);
    }
}
