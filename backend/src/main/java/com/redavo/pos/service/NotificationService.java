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
 * EMAIL → Gmail SMTP via JavaMailSender (Spring Boot Mail)
 * WHATSAPP → Meta WhatsApp Cloud API (free, graph.facebook.com)
 * SMS → Demo mode (can be wired to Twilio/Africa's Talking later)
 *
 * Each channel independently falls back to DEMO mode when not configured.
 * DEMO = logs to console + saves a DEMO record in notification_log table.
 */
@Service
public class NotificationService {

    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private MetaWhatsAppConfig metaConfig;
    @Autowired
    private RestTemplate restTemplate;
    @Autowired
    private NotificationLogRepository notificationLogRepo;

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

    @Value("${app.admin.notify-email:}")
    private String adminNotifyEmail;

    public void sendAdminContactEmail(String customerName, String customerEmail, String messageBody) {
        String toAddress = adminNotifyEmail != null && !adminNotifyEmail.isBlank() ? adminNotifyEmail : fromAddress;
        String subject = "New Contact Form Submission from " + customerName;
        String html = String.format(
                "<h3>New Contact Message</h3>" +
                        "<p><strong>Name:</strong> %s</p>" +
                        "<p><strong>Email:</strong> %s</p>" +
                        "<br/>" +
                        "<p><strong>Message:</strong></p>" +
                        "<p>%s</p>",
                customerName.replace("<", "&lt;").replace(">", "&gt;"),
                customerEmail.replace("<", "&lt;").replace(">", "&gt;"),
                messageBody.replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>"));

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom("Storefront Contact <" + fromAddress + ">");
            helper.setReplyTo(customerEmail);
            helper.setTo(toAddress);
            helper.setSubject(subject);
            helper.setText("Name: " + customerName + "\nEmail: " + customerEmail + "\n\n" + messageBody, html);
            mailSender.send(message);
            System.out.println("[EMAIL ✅] Sent contact notification to " + toAddress);
        } catch (Exception e) {
            System.err.println("[EMAIL ❌] Failed to send contact notification: " + e.getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 📧 EMAIL — Gmail SMTP
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
            // Always multipart=true — required for setText(plain, html) even without
            // attachments
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("RedAvo <" + fromAddress + ">");
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

            helper.setText(body, htmlBody); // (plain, html) — inbox shows HTML, fallback to plain

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
            System.err.println("[EMAIL ❌ Auth failed] Check your Gmail App Password in application.properties — "
                    + e.getMessage());
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
    // 💬 WHATSAPP — Meta Cloud API (graph.facebook.com)
    // ═══════════════════════════════════════════════════════════
    //
    // HOW IT WORKS AT RUNTIME:
    //
    // Case A — ORDER CONFIRMATIONS (free-form text):
    // The customer just bought something so they are likely reachable.
    // Meta allows free-form text when customer messaged you in last 24h
    // OR when using sandbox test numbers.
    // → This app sends free-form text. Works for: test numbers, and customers
    // who have interacted with your WhatsApp number recently.
    //
    // Case B — BULK MARKETING (to any opted-in customer):
    // Must use a pre-approved Message Template.
    // → This app sends free-form for now. See below to add template support.
    // → For bulk to work reliably in production, create a template at:
    // business.facebook.com → WhatsApp Manager → Message Templates
    //
    // PHONE NUMBER FORMAT:
    // Must be international format WITHOUT the + sign.
    // Example: +263771234567 → 263771234567
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
        payload.put("recipient_type", "individual");
        payload.put("to", to);
        payload.put("type", "text");
        payload.put("text", Map.of("preview_url", false, "body", message));

        sendToMetaApi(customerId, customerName, phone, message, orderRef, payload);
    }

    /**
     * sendWhatsAppTemplate — use for bulk marketing to reach any opted-in customer.
     * Template must be approved by Meta first (create at business.facebook.com).
     *
     * @param templateName e.g. "redavo_order_confirm"
     * @param langCode     e.g. "en_US"
     * @param components   list of template variable components (can be null)
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
        template.put("name", templateName);
        template.put("language", Map.of("code", langCode != null ? langCode : "en_US"));
        if (components != null && !components.isEmpty()) {
            template.put("components", components);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("messaging_product", "whatsapp");
        payload.put("to", to);
        payload.put("type", "template");
        payload.put("template", template);

        sendToMetaApi(customerId, customerName, phone, "Template: " + templateName, orderRef, payload);
    }

    // ═══════════════════════════════════════════════════════════
    // 📱 SMS — Twilio Integration
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
    // CHANNEL STATUS — returned to DashboardController
    // ═══════════════════════════════════════════════════════════

    public Map<String, String> getChannelStatus() {
        Map<String, String> status = new LinkedHashMap<>();
        status.put("email", demoMode ? "DEMO" : "LIVE");
        status.put("whatsapp", metaConfig.isConfigured() ? "LIVE" : "DEMO");
        status.put("sms", twilioEnabled ? "LIVE" : "DEMO");
        return status;
    }

    // ═══════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════

    public List<NotificationLog> getNotificationHistory() {
        return notificationLogRepo.findAll();
    }

    public long getMessagesSentToday() {
        return notificationLogRepo.countBySentAtAfter(LocalDate.now().atStartOfDay());
    }

    // ═══════════════════════════════════════════════════════════
    // PRIVATE HELPERS
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
        if (subject != null)
            System.out.println("│  Subject : " + subject);
        System.out.printf("│  Message : %.120s%n", message);
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

    // ═══════════════════════════════════════════════════════════
    // 🎁 GIFT CARD EMAILS
    // ═══════════════════════════════════════════════════════════

    /**
     * Sends the styled gift card delivery email to the recipient.
     * Uses logo2.png embedded as a base64 inline image.
     */
    public void sendGiftCardEmail(String recipientName, String recipientEmail,
                                  String code, java.math.BigDecimal balance,
                                  String personalMessage, String purchaserName, String imageUrl) {
        String displayName = recipientName != null && !recipientName.isBlank() ? recipientName : "there";
        String fromPerson  = purchaserName != null && !purchaserName.isBlank() ? purchaserName : "Someone special";
        String msgBlock    = personalMessage != null && !personalMessage.isBlank()
            ? "<div style='background:#fdf6ec;border-left:3px solid #8F0D13;padding:16px 20px;margin:20px 0;font-style:italic;color:#444;border-radius:4px;'>" +
              personalMessage.replace("<","&lt;").replace(">","&gt;").replace("\n","<br/>") + "</div>"
            : "";

        String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
            "<meta name='viewport' content='width=device-width,initial-scale=1'></head><body style='margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;'>" +
            "<div style='max-width:580px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);'>" +

            // Header — dark maroon brand bar
            "<div style='background:#5E080C;padding:36px 40px;text-align:center;'>" +
            "<img src='https://redavowear.com/images/logo2.png' alt='RedAvo' width='64' height='64' style='border-radius:50%;margin-bottom:16px;'/>" +
            "<h1 style='color:#ffffff;font-size:26px;margin:0;letter-spacing:0.04em;'>A Gift Card for You</h1>" +
            "<p style='color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;'>From " + fromPerson.replace("<","&lt;") + "</p>" +
            "</div>" +

            // Body
            "<div style='padding:40px;'>" +
            "<p style='font-size:17px;color:#2a2a28;margin:0 0 8px;'>Hi " + displayName.replace("<","&lt;") + ",</p>" +
            "<p style='color:#555;line-height:1.7;margin:0 0 24px;'>" + fromPerson.replace("<","&lt;") + " has sent you a RedAvo Activewear gift card. Treat yourself to something you'll love!</p>" +

            msgBlock +

            // Gift card visual
            "<div style='" + ((imageUrl != null && !imageUrl.isBlank()) ? "background:linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(" + imageUrl + ");background-size:cover;background-position:center;" : "background:linear-gradient(135deg,#5E080C 0%,#8F0D13 60%,#c0392b 100%);") + "border-radius:12px;padding:32px 28px;margin:24px 0;text-align:center;'>" +
            "<p style='color:rgba(255,255,255,0.75);font-size:12px;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 12px;'>RedAvo Gift Card</p>" +
            "<p style='color:#ffffff;font-size:36px;font-weight:bold;letter-spacing:0.18em;margin:0 0 16px;font-family:monospace;'>" + code + "</p>" +
            "<p style='color:rgba(255,255,255,0.85);font-size:14px;margin:0;'>Balance: <strong style='font-size:22px;color:#ffffff;'>$" + balance.toPlainString() + "</strong></p>" +
            "<p style='color:rgba(255,255,255,0.6);font-size:11px;margin:12px 0 0;'>Never expires · Digital only</p>" +
            "</div>" +

            // How to redeem
            "<h3 style='color:#2a2a28;font-size:15px;margin:24px 0 12px;'>How to redeem</h3>" +
            "<ol style='color:#555;line-height:1.8;padding-left:20px;margin:0 0 28px;'>" +
            "<li>Visit <a href='https://redavowear.com/shop' style='color:#8F0D13;'>redavowear.com/shop</a> and add items to your cart</li>" +
            "<li>Proceed to checkout</li>" +
            "<li>Enter your gift card code in the &quot;Have a Gift Card?&quot; section</li>" +
            "<li>Your balance will be automatically applied</li>" +
            "</ol>" +
            "<div style='text-align:center;margin:32px 0;'>" +
            "<a href='https://redavowear.com/shop' style='background:#8F0D13;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:14px;font-weight:bold;letter-spacing:0.06em;display:inline-block;'>Shop Now</a>" +
            "</div>" +
            "<p style='color:#aaa;font-size:12px;text-align:center;border-top:1px solid #eee;padding-top:20px;margin-top:20px;'>RedAvo Activewear · This gift card does not expire and has no fees.<br/>Check your balance at <a href='https://redavowear.com/gift-card/check-balance' style='color:#8F0D13;'>redavowear.com/gift-card/check-balance</a></p>" +
            "</div></div></body></html>";

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("RedAvo Gift Cards <" + fromAddress + ">");
            helper.setTo(recipientEmail);
            helper.setSubject("🎁 You've received a RedAvo gift card from " + fromPerson);
            helper.setText("You have a RedAvo gift card! Code: " + code + " | Balance: $" + balance.toPlainString(), html);
            mailSender.send(mimeMessage);
            System.out.println("[GIFT CARD EMAIL ✅] Sent to " + recipientEmail + " | Code: " + code);
        } catch (Exception e) {
            System.err.println("[GIFT CARD EMAIL ❌] Failed to send to " + recipientEmail + ": " + e.getMessage());
            throw new RuntimeException("Failed to send gift card email", e);
        }
    }

    /**
     * Birthday reminder — fires when a recipient's birthday matches today and card is unused.
     */
    public void sendGiftCardBirthdayReminder(String recipientName, String recipientEmail,
                                             java.math.BigDecimal remainingBalance, String code) {
        String displayName = recipientName != null && !recipientName.isBlank() ? recipientName : "there";
        String html = "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;'>" +
            "<div style='max-width:560px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);'>" +
            "<div style='background:#5E080C;padding:32px 40px;text-align:center;'>" +
            "<img src='https://redavowear.com/images/logo2.png' alt='RedAvo' width='56' height='56' style='border-radius:50%;margin-bottom:12px;'/>" +
            "<h1 style='color:#ffffff;font-size:22px;margin:0;'>Happy Birthday! 🎂</h1>" +
            "</div>" +
            "<div style='padding:40px;text-align:center;'>" +
            "<p style='font-size:17px;color:#2a2a28;'>Hi " + displayName.replace("<","&lt;") + ",</p>" +
            "<p style='color:#555;line-height:1.7;'>You have an unused RedAvo gift card worth <strong style='color:#8F0D13;font-size:20px;'>$" + remainingBalance.toPlainString() + "</strong> waiting for you — treat yourself today!</p>" +
            "<div style='background:#fdf6ec;border-radius:8px;padding:20px;margin:24px 0;font-family:monospace;font-size:22px;letter-spacing:0.15em;color:#5E080C;font-weight:bold;'>" + code + "</div>" +
            "<a href='https://redavowear.com/shop' style='background:#8F0D13;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:bold;display:inline-block;'>Treat Yourself</a>" +
            "<p style='color:#aaa;font-size:12px;margin-top:28px;'>RedAvo Activewear · Your gift card never expires.</p>" +
            "</div></div></body></html>";

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("RedAvo Activewear <" + fromAddress + ">");
            helper.setTo(recipientEmail);
            helper.setSubject("🎂 Happy Birthday! Your RedAvo gift card is waiting for you");
            helper.setText("Happy Birthday! You have an unused $" + remainingBalance.toPlainString() + " gift card. Code: " + code, html);
            mailSender.send(mimeMessage);
            System.out.println("[BIRTHDAY REMINDER ✅] Sent to " + recipientEmail);
        } catch (Exception e) {
            System.err.println("[BIRTHDAY REMINDER ❌] Failed for " + recipientEmail + ": " + e.getMessage());
        }
    }
}

