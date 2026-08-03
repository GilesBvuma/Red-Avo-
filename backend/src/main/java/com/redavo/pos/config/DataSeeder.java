package com.redavo.pos.config;

import com.redavo.pos.model.Customer;
import com.redavo.pos.model.LedgerReason;
import com.redavo.pos.model.Product;
import com.redavo.pos.model.ProductVariant;
import com.redavo.pos.repository.CustomerRepository;
import com.redavo.pos.repository.ProductRepository;
import com.redavo.pos.service.StockLedgerService;
import com.redavo.pos.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;

/**
 * Seeds demo data on startup — runs only when {@code app.seed.enabled=true}.
 * <p>
 * Set {@code SEED_ENABLED=false} (or {@code app.seed.enabled=false} in
 * {@code application.properties}) before deploying to staging or production.
 * <p>
 * Because this bean is wired with {@link UserService}, it also ensures the
 * default ADMIN account exists — this runs in all environments so the system
 * is never locked out.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    private final ProductRepository  productRepository;
    private final CustomerRepository customerRepository;
    private final UserService        userService;
    private final StockLedgerService stockLedgerService;

    public DataSeeder(ProductRepository productRepository,
                      CustomerRepository customerRepository,
                      UserService userService,
                      StockLedgerService stockLedgerService) {
        this.productRepository  = productRepository;
        this.customerRepository = customerRepository;
        this.userService        = userService;
        this.stockLedgerService = stockLedgerService;
    }

    @Override
    public void run(String... args) {
        // ── Admin account — always ensured, all environments ─────────────────
        // Change credentials in production via environment variables or Vault.
        userService.ensureAdminExists(
                "admin",
                "admin@redavo.com",
                "RedAvoAdmin2024!");

        // ── Demo data — local development only ────────────────────────────────
        if (!seedEnabled) {
            System.out.println("[DataSeeder] Seed disabled (app.seed.enabled=false) — skipping demo data.");
            return;
        }

        seedProducts();
        seedCustomers();
    }

    // ─── Products ────────────────────────────────────────────────────────────

    private void seedProducts() {
        if (productRepository.count() > 0) {
            System.out.println("[DataSeeder] Products already seeded — skipping.");
            return;
        }

        seedProductWithVariant("Red Avo Sports Bra (Crimson)", "Sports Bras", 45.00, 23, 0);
        seedProductWithVariant("Navy High-Waist Leggings",     "Leggings",    65.00, 18, 20);
        seedProductWithVariant("Pink Zip Jacket",               "Jackets",     89.00,  7,  0);
        seedProductWithVariant("Red Crop Hoodie",               "Tops",        75.00,  4, 15);
        seedProductWithVariant("Navy Bike Shorts",              "Leggings",    35.00, 31,  0);
        seedProductWithVariant("Pink Sports Set (Bra+Leggings)","Sets",        99.00, 12, 10);
        seedProductWithVariant("Red Running Tank",              "Tops",        29.00,  0,  0);
        seedProductWithVariant("White Mesh Cap",                "Accessories", 25.00, 45,  0);
        seedProductWithVariant("Red Avo Water Bottle",          "Accessories", 22.00, 19,  0);
        seedProductWithVariant("Resistance Band Set",           "Accessories", 18.00,  8,  0);

        System.out.println("[DataSeeder] Seeded 10 products with variants.");
    }

    private void seedProductWithVariant(String name, String category,
                                        double price, int stock, int discount) {
        Product p = new Product();
        p.setName(name);
        p.setCategory(category);
        p.setPrice(price);
        p.setStockQuantity(stock);
        p.setDiscount(discount);
        p.setIsActive(true);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(p);
        variant.setColor("Default");
        variant.setSize("Standard");
        variant.setSku("SKU-" + name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase());
        variant.setCostPrice(BigDecimal.valueOf(price * 0.4)); // Dummy COGS at 40% of retail
        variant.setSellPrice(BigDecimal.valueOf(price));
        variant.setActive(true);

        p.setVariants(Collections.singletonList(variant));

        // Save product (cascades to variant)
        Product savedProduct = productRepository.save(p);

        // Initialize stock through the authoritative ledger
        if (stock > 0) {
            ProductVariant savedVariant = savedProduct.getVariants().get(0);
            stockLedgerService.applyDelta(
                    savedVariant.getId(),
                    1L, // DEFAULT_STORE_ID
                    stock,
                    LedgerReason.RECEIPT,
                    "INITIAL_SEED",
                    "system"
            );
        }
    }

    // ─── Customers ───────────────────────────────────────────────────────────

    private void seedCustomers() {
        if (customerRepository.count() > 0) {
            System.out.println("[DataSeeder] Customers already seeded — skipping.");
            return;
        }

        customerRepository.save(buildCustomer("Tanya",   "Moyo",      "tanya@email.com",   "+263771234567", true,  5));
        customerRepository.save(buildCustomer("Rudo",    "Chikwanda", "rudo@email.com",    "+263772345678", true,  3));
        customerRepository.save(buildCustomer("Farai",   "Banda",     "farai@email.com",   "+263773456789", false, 2));
        customerRepository.save(buildCustomer("Natasha", "Dube",      "natasha@email.com", "+263774567890", true,  7));
        customerRepository.save(buildCustomer("Simba",   "Ncube",     "simba@email.com",   "+263775678901", false, 1));

        System.out.println("[DataSeeder] Seeded 5 customers.");
    }

    private Customer buildCustomer(String firstName, String lastName, String email,
                                    String phone, boolean whatsappOptIn, int totalPurchases) {
        Customer c = new Customer();
        c.setFirstName(firstName);
        c.setLastName(lastName);
        c.setEmail(email);
        c.setPhoneNumber(phone);
        c.setWhatsappOptIn(whatsappOptIn);
        c.setTotalPurchases(totalPurchases);
        return c;
    }
}
