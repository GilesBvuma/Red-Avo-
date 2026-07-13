package com.redavo.pos.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;

/**
 * MetaWhatsAppConfig — Configures the Meta WhatsApp Cloud API connection.
 *
 * Meta WhatsApp Cloud API:
 *  - Free up to 1,000 conversations/month
 *  - No per-message cost within the free tier
 *  - Supports both single (order confirmations) and bulk (marketing) messages
 *
 * ─── HOW TO SET UP (one-time, ~30 minutes) ───────────────────────────
 *
 * STEP 1 — Facebook Developer Account
 *   Go to https://developers.facebook.com → My Apps → Create App
 *   Select type: "Business" → give it a name (e.g. "Red Avo POS")
 *
 * STEP 2 — Add WhatsApp Product
 *   Inside your app dashboard → Add Product → WhatsApp → Set Up
 *
 * STEP 3 — Get your credentials (from "Getting Started" in WhatsApp section)
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │  Phone Number ID  →  copy the numeric ID shown (e.g. 12345678)  │
 *   │  Access Token     →  copy the temporary token (starts with EAA) │
 *   │                      (for permanent token see STEP 4)           │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * STEP 4 — Permanent Access Token (so it never expires)
 *   Facebook Business Settings → Users → System Users
 *   Create a system user → Assign your WhatsApp app with "Manage" role
 *   Generate Token → select your app → select whatsapp_business_messaging
 *   Copy the long token — this never expires
 *
 * STEP 5 — Add a test recipient (for sandbox testing)
 *   WhatsApp → Getting Started → "To" field → Add phone number
 *   You must verify it with a code sent to that WhatsApp number
 *   (You get 5 free test recipients on the sandbox number)
 *
 * STEP 6 — Add to backend/.env
 *   META_PHONE_NUMBER_ID=your-phone-number-id
 *   META_ACCESS_TOKEN=EAAxxxxxxxxxxxxx...
 *
 * STEP 7 — Restart the backend → channel bar shows WhatsApp as LIVE 🟢
 *
 * ─── MESSAGE TYPES ───────────────────────────────────────────────────
 *
 * FREE-FORM TEXT (used by this app for order confirmations):
 *   ✅ Works when customer has sent YOU a WhatsApp message in last 24h
 *   ✅ Works for test numbers you registered in the sandbox
 *   ❌ Cannot be used for bulk outbound to arbitrary numbers
 *
 * TEMPLATE MESSAGES (used for bulk marketing):
 *   ✅ Can be sent to any opted-in customer at any time
 *   ⚠️  Template must be approved by Meta first (usually <24h)
 *   Create templates at: business.facebook.com → WhatsApp Manager → Message Templates
 */
@Configuration
public class MetaWhatsAppConfig {

    @Value("${meta.whatsapp.phone.number.id:DEMO_PHONE_ID}")
    private String phoneNumberId;

    @Value("${meta.whatsapp.access.token:DEMO_TOKEN}")
    private String accessToken;

    @Value("${meta.whatsapp.api.version:v19.0}")
    private String apiVersion;

    @PostConstruct
    public void printStatus() {
        if (isConfigured()) {
            System.out.println("╔══════════════════════════════════════════════╗");
            System.out.println("║  ✅ Meta WhatsApp Cloud API — LIVE           ║");
            System.out.println("║  Phone Number ID : " + phoneNumberId);
            System.out.println("║  API Version     : " + apiVersion);
            System.out.println("╚══════════════════════════════════════════════╝");
        } else {
            System.out.println("╔══════════════════════════════════════════════╗");
            System.out.println("║  🔔 Meta WhatsApp — DEMO mode                ║");
            System.out.println("║  Messages logged to console + DB only.       ║");
            System.out.println("║  Set META_PHONE_NUMBER_ID + META_ACCESS_TOKEN ║");
            System.out.println("║  in backend/.env to go live.                 ║");
            System.out.println("╚══════════════════════════════════════════════╝");
        }
    }

    /** True when real Meta credentials are present */
    public boolean isConfigured() {
        return phoneNumberId != null && !phoneNumberId.equals("DEMO_PHONE_ID")
                && accessToken   != null && !accessToken.equals("DEMO_TOKEN");
    }

    /** Full Graph API base URL for sending messages */
    public String getMessagesUrl() {
        return "https://graph.facebook.com/" + apiVersion + "/" + phoneNumberId + "/messages";
    }

    public String getAccessToken()  { return accessToken; }
    public String getPhoneNumberId(){ return phoneNumberId; }
    public String getApiVersion()   { return apiVersion; }

    /** RestTemplate bean used by NotificationService for HTTP calls to Meta API */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
