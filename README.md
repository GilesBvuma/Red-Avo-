# Red Avo POS — Full-Stack Point of Sale System

> **Authentic · Fearless** — Women's Sportswear Brand POS Dashboard

A complete, production-ready POS system for Red Avo sportswear, featuring a Next.js 16 frontend at `/pos` and a Spring Boot REST API backend with H2 in-memory database.

---

## Quick Start

### Prerequisites
- **Node.js** 18+ — [nodejs.org](https://nodejs.org)
- **Java 17+** — [adoptium.net](https://adoptium.net)
- **Maven 3.8+** — [maven.apache.org](https://maven.apache.org) (or use the `mvnw` wrapper if present)

---

### 1. Start the Backend (Spring Boot)

```bash
cd "backend"
mvn spring-boot:run
```

The API will start on **http://localhost:8080**

- **H2 Console**: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:redavodb`
  - Username: `sa` | Password: *(leave blank)*
- The database is seeded automatically with **10 products** and **5 demo customers** on startup.

---

### 2. Start the Frontend (Next.js)

From the project root:

```bash
npm run dev
```

Then open **http://localhost:3000/pos** in your browser.

> **Note**: The POS is a separate route — the existing Red Avo marketing site remains at `http://localhost:3000`

---

## POS Features

### 🛍️ Product Management
- Browse 10 pre-seeded sportswear products in a 3-column grid
- Category filtering: All | Tops | Leggings | Sports Bras | Jackets | Sets | Accessories
- Real-time search bar
- Stock status badges: **In Stock** · **Low Stock** · **Out of Stock**
- Discount badges (e.g. 20% OFF)
- Add to Cart → quantity selector toggle

### 🛒 Order Management
- Live cart with line totals
- Subtotal + 15% Tax + Total calculation
- Customer info capture (Name, Email, Phone)
- Payment methods: Cash | Card | QR Code
- Complete Sale → triggers stock deduction + thank-you notification

### 📣 Bulk Notifications
- Customer segment targeting:
  - All Customers
  - WhatsApp Opt-in only
  - Last 30 Days
  - 3+ Purchases
- Message types: Email | WhatsApp | SMS
- Template editor with `[FirstName]` personalisation
- Preview mode
- Progress bar + results summary (Sent / Failed / Total)

### 📊 Dashboard Stats
- Today's Sales ($)
- Orders Today (count)
- Low Stock Items (alert badge)
- Messages Sent Today

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/{id}/stock` | Update stock |
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/orders` | List all orders |
| POST | `/api/orders` | Create order (deducts stock + sends notification) |
| POST | `/api/notify/email` | Send single email |
| POST | `/api/notify/whatsapp` | Send single WhatsApp |
| POST | `/api/notify/sms` | Send single SMS |
| POST | `/api/notify/bulk` | Bulk notification to segment |
| GET | `/api/notify/history` | Notification log |
| GET | `/api/dashboard/stats` | Dashboard statistics |

---

## Demo Mode

By default, `notification.demo.mode=true` in `application.properties`.

This means:
- **No real emails or SMS are sent**
- All notifications are **logged to the console** and saved to the `NotificationLog` table
- The frontend shows a **🔔 DEMO toast** when notifications would be sent
- View the history at **POS → Order Panel → View notification history**

### To enable live notifications

Edit `backend/src/main/resources/application.properties`:

```properties
notification.demo.mode=false

# Gmail — use an App Password (not your real password)
spring.mail.username=your@gmail.com
spring.mail.password=your-app-password

# Twilio (for WhatsApp/SMS)
twilio.account.sid=your-account-sid
twilio.auth.token=your-auth-token
```

---

## Seed Data

### Products (10 items)

| Name | Category | Price | Stock |
|------|----------|-------|-------|
| Red Avo Sports Bra (Crimson) | Sports Bras | $45.00 | 23 |
| Navy High-Waist Leggings | Leggings | $65.00 | 18 — 20% OFF |
| Pink Zip Jacket | Jackets | $89.00 | 7 |
| Red Crop Hoodie | Tops | $75.00 | **4 ← LOW STOCK** |
| Navy Bike Shorts | Leggings | $35.00 | 31 |
| Pink Sports Set (Bra+Leggings) | Sets | $99.00 | 12 |
| Red Running Tank | Tops | $29.00 | **0 ← OUT OF STOCK** |
| White Mesh Cap | Accessories | $25.00 | 45 |
| Red Avo Water Bottle | Accessories | $22.00 | 19 |
| Resistance Band Set | Accessories | $18.00 | 8 |

### Customers (5 demo)

| Name | Email | WhatsApp |
|------|-------|----------|
| Tanya Moyo | tanya@email.com | ✅ |
| Rudo Chikwanda | rudo@email.com | ✅ |
| Farai Banda | farai@email.com | ❌ |
| Natasha Dube | natasha@email.com | ✅ |
| Simba Ncube | simba@email.com | ❌ |

---

## File Structure

```
Red Avo/
├── backend/                               ← Spring Boot API
│   ├── pom.xml
│   └── src/main/java/com/redavo/pos/
│       ├── RedAvoPosApplication.java
│       ├── config/
│       │   ├── CorsConfig.java
│       │   └── DataSeeder.java
│       ├── controller/
│       │   ├── ProductController.java
│       │   ├── CustomerController.java
│       │   ├── OrderController.java
│       │   ├── NotificationController.java
│       │   └── DashboardController.java
│       ├── model/
│       │   ├── Product.java
│       │   ├── Customer.java
│       │   ├── Order.java
│       │   ├── OrderItem.java
│       │   └── NotificationLog.java
│       ├── repository/               ← JPA Repositories
│       └── service/
│           ├── ProductService.java
│           ├── OrderService.java
│           ├── NotificationService.java
│           └── BulkNotificationService.java
│
├── src/app/pos/                           ← Next.js POS Route
│   ├── layout.jsx
│   ├── page.jsx                           ← Main POS dashboard
│   ├── pos.css                            ← All POS styles
│   ├── lib/api.js                         ← API client
│   └── components/
│       ├── Sidebar.jsx
│       ├── ProductGrid.jsx
│       ├── ProductCard.jsx
│       ├── OrderPanel.jsx
│       ├── BulkNotifyPanel.jsx
│       ├── StatsBar.jsx
│       ├── CategoryTabs.jsx
│       ├── NotificationToast.jsx
│       └── ActiveOrdersBar.jsx
│
└── README.md                              ← This file
```

---

## Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--pos-red` | `#C0392B` | Primary actions, active states |
| `--pos-red-dark` | `#8B0000` | Hover states, logo |
| `--pos-black` | `#1A1A1A` | Sidebar background |
| `--pos-bg` | `#F5F5F5` | Page background |
| `--pos-cream` | `#FAFAF5` | Accent |
| `--pos-white` | `#FFFFFF` | Cards & panels |

---

*Red Avo POS — Built for her motion. Fearless in every sale.* 🥑❤️
