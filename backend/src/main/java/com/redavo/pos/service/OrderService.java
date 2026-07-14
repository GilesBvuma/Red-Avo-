package com.redavo.pos.service;

import com.redavo.pos.model.*;
import com.redavo.pos.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    private final ProductRepository  productRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository    orderRepository;
    private final NotificationService notificationService;
    private final InvoiceService     invoiceService;
    private final StockLedgerService stockLedgerService;
    private final ProductVariantRepository variantRepository;

    // Default store ID for orders placed via POS before full variant wiring.
    // Corresponds to the "Main Store" row inserted by V3 migration.
    private static final Long DEFAULT_STORE_ID = 1L;

    public OrderService(ProductRepository productRepository,
                        CustomerRepository customerRepository,
                        OrderRepository orderRepository,
                        NotificationService notificationService,
                        InvoiceService invoiceService,
                        StockLedgerService stockLedgerService,
                        ProductVariantRepository variantRepository) {
        this.productRepository  = productRepository;
        this.customerRepository = customerRepository;
        this.orderRepository    = orderRepository;
        this.notificationService = notificationService;
        this.invoiceService     = invoiceService;
        this.stockLedgerService = stockLedgerService;
        this.variantRepository  = variantRepository;
    }

    @Transactional
    public Order createOrder(Order order) {
        Long storeId = order.getStoreId();
        if (storeId == null) {
            storeId = resolveStoreId();
            order.setStoreId(storeId);
        }
        
        Long currentUserId = resolveUserId();
        if (currentUserId != null) {
            order.setUserId(currentUserId);
        }

        // Set back-reference on each order item before saving
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                item.setOrder(order);
            }
        }

        Order savedOrder = orderRepository.save(order);

        // ── Deduct stock via the ledger (authoritative path) & Compute COGS ──
        // For ONLINE orders, stock is deducted later upon fulfilment.
        String actor = resolveActor();
        double totalCogs = 0.0;
        if (!"ONLINE".equalsIgnoreCase(savedOrder.getSource())) {
            if (savedOrder.getItems() != null) {
                for (OrderItem item : savedOrder.getItems()) {
                    Double itemCogs = deductStock(item, savedOrder, actor);
                    if (itemCogs != null) totalCogs += itemCogs;
                }
            }
        }
        savedOrder.setCostOfSale(totalCogs);

        // ── Auto-upsert customer from order details ───────────────────────────
        Order notifyOrder = savedOrder;

        if (savedOrder.getCustomerEmail() != null && !savedOrder.getCustomerEmail().isBlank()) {
            String email = savedOrder.getCustomerEmail().trim().toLowerCase();

            Optional<Customer> existing = customerRepository.findByEmail(email);
            Customer customer;
            if (existing.isPresent()) {
                customer = existing.get();
            } else {
                customer = new Customer();
                String fullName = savedOrder.getCustomerName() != null ? savedOrder.getCustomerName() : "";
                String[] parts = fullName.trim().split(" ", 2);
                customer.setFirstName(parts[0]);
                customer.setLastName(parts.length > 1 ? parts[1] : "");
                customer.setEmail(email);
                customer.setPhoneNumber(savedOrder.getCustomerPhone());
            }

            customer.setTotalPurchases(
                    (customer.getTotalPurchases() == null ? 0 : customer.getTotalPurchases()) + 1);
            double orderTotal = savedOrder.getTotal() != null ? savedOrder.getTotal() : 0.0;
            customer.setLifetimeValue(
                    (customer.getLifetimeValue() == null ? 0.0 : customer.getLifetimeValue()) + orderTotal);
            customer.setLastPurchaseAt(LocalDateTime.now());
            if (savedOrder.getCustomerPhone() != null && !savedOrder.getCustomerPhone().isBlank()) {
                customer.setPhoneNumber(savedOrder.getCustomerPhone());
            }

            Customer savedCustomer = customerRepository.save(customer);
            savedOrder.setCustomerId(savedCustomer.getId());
            notifyOrder = orderRepository.save(savedOrder);

        } else if (savedOrder.getCustomerId() != null) {
            Optional<Customer> byId = customerRepository.findById(savedOrder.getCustomerId());
            if (byId.isPresent()) {
                Customer c = byId.get();
                c.setTotalPurchases(
                        (c.getTotalPurchases() == null ? 0 : c.getTotalPurchases()) + 1);
                double total = savedOrder.getTotal() != null ? savedOrder.getTotal() : 0.0;
                c.setLifetimeValue(
                        (c.getLifetimeValue() == null ? 0.0 : c.getLifetimeValue()) + total);
                c.setLastPurchaseAt(LocalDateTime.now());
                customerRepository.save(c);
            }
        }

        // ── Trigger notifications ─────────────────────────────────────────────
        String orderRef     = "ORD-" + notifyOrder.getId();
        String customerName = notifyOrder.getCustomerName() != null
                ? notifyOrder.getCustomerName() : "Valued Customer";
        String firstName    = customerName.contains(" ")
                ? customerName.split(" ")[0] : customerName;
        double total        = notifyOrder.getTotal() != null ? notifyOrder.getTotal() : 0.0;

        String emailBody = "Hi " + firstName + "! 🥑❤️\n\n"
                + "Thank you for your Red Avo purchase!\n"
                + "Order " + orderRef + " — Total: $" + String.format("%.2f", total) + "\n\n"
                + "Your order is confirmed. Move with confidence!\n\n"
                + "— The Red Avo Team";

        if (notifyOrder.getCustomerEmail() != null && !notifyOrder.getCustomerEmail().isBlank()) {
            byte[] pdf = invoiceService.generateInvoice(notifyOrder);
            notificationService.sendEmail(
                    notifyOrder.getCustomerId(), customerName,
                    notifyOrder.getCustomerEmail(), emailBody,
                    "Red Avo Order Confirmation — " + orderRef, orderRef, pdf);
        }

        if (notifyOrder.getCustomerPhone() != null && !notifyOrder.getCustomerPhone().isBlank()) {
            notificationService.sendSms(
                    notifyOrder.getCustomerId(), customerName,
                    notifyOrder.getCustomerPhone(),
                    "Hi " + firstName + "! Your Red Avo order " + orderRef
                            + " ($" + String.format("%.2f", total) + ") is confirmed. Thanks!",
                    orderRef);
        }

        // ── Admin Alerts (Email & SMS/Dashboard) ──────────────────────────────
        double cogs = notifyOrder.getCostOfSale() != null ? notifyOrder.getCostOfSale() : 0.0;
        double profit = total - cogs;
        Long adminStoreId = notifyOrder.getStoreId() != null ? notifyOrder.getStoreId() : DEFAULT_STORE_ID;
        String adminEmailBody = String.format("New Order: %s\nTotal: $%.2f\nCOGS: $%.2f\nGross Profit: $%.2f\nStore ID: %d\nCustomer: %s",
                orderRef, total, cogs, profit, adminStoreId, customerName);
        
        // Email to seed admin
        notificationService.sendEmail(null, "Admin", "admin@redavo.com", adminEmailBody, "New Order Alert — " + orderRef, orderRef, null);
        
        // SMS to seed admin (using a dummy admin number for now)
        notificationService.sendSms(null, "Admin", "+263700000000", adminEmailBody, orderRef);

        return notifyOrder;
    }

    /**
     * Deducts stock for one order item and returns the cost of sale for that item.
     * <p>
     * If the item carries a {@code variantId}, the deduction goes through the
     * {@link StockLedgerService} (authoritative path). If it only has a legacy
     * {@code productId} (no variant), the old direct field update runs with a
     * deprecation warning — this path is removed in Phase 2 when the POS
     * frontend is fully wired to variants.
     */
    private Double deductStock(OrderItem item, Order order, String actor) {
        // Prefer explicit variantId if provided by POS (Phase 2)
        if (item.getVariantId() != null) {
            ProductVariant variant = variantRepository.findById(item.getVariantId())
                    .orElseThrow(() -> new IllegalArgumentException("Variant not found: " + item.getVariantId()));
            try {
                stockLedgerService.applyDelta(
                        variant.getId(),
                        DEFAULT_STORE_ID,
                        -item.getQuantity(),
                        LedgerReason.SALE,
                        "ORD-" + order.getId(),
                        actor);
                        
                // Update cached stock quantities
                variant.setStockQuantity(Math.max(0, variant.getStockQuantity() - item.getQuantity()));
                variantRepository.save(variant);
                
                Product product = variant.getProduct();
                product.setStockQuantity(Math.max(0, product.getStockQuantity() - item.getQuantity()));
                product.computeStockStatus();
                productRepository.save(product);

            } catch (IllegalArgumentException e) {
                System.err.println("[OrderService] Stock deduction via ledger failed for variant "
                        + variant.getSku() + ": " + e.getMessage());
            }
            java.math.BigDecimal cost = variant.getCostPrice();
            return (cost != null ? cost.doubleValue() : 0.0) * (item.getQuantity() != null ? item.getQuantity() : 1);
        }

        // Legacy fallback: resolve first active variant via productId
        if (item.getProductId() == null) return 0.0;
        List<ProductVariant> variants = variantRepository.findByProductIdAndActiveTrue(item.getProductId());

        if (!variants.isEmpty()) {
            ProductVariant variant = variants.get(0);
            try {
                stockLedgerService.applyDelta(
                        variant.getId(),
                        DEFAULT_STORE_ID,
                        -item.getQuantity(),
                        LedgerReason.SALE,
                        "ORD-" + order.getId(),
                        actor);
            } catch (IllegalArgumentException e) {
                System.err.println("[OrderService] Stock deduction via ledger failed for variant "
                        + variant.getSku() + ": " + e.getMessage());
            }
            java.math.BigDecimal cost = variant.getCostPrice();
            return (cost != null ? cost.doubleValue() : 0.0) * (item.getQuantity() != null ? item.getQuantity() : 1);
        } else {
            System.err.println("[OrderService ⚠️ DEPRECATED] No variants found for product "
                    + item.getProductId() + " — falling back to direct stock update.");
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                int newQty = Math.max(0, product.getStockQuantity() - item.getQuantity());
                product.setStockQuantity(newQty);
                product.computeStockStatus();
                productRepository.save(product);
            });
            return 0.0;
        }
    }

    /** Reads the authenticated actor's username from the security context. */
    private String resolveActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            return auth.getName();
        }
        return "system";
    }

    private Long resolveStoreId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.redavo.pos.security.RedAvoUserDetails) {
            com.redavo.pos.security.RedAvoUserDetails details = (com.redavo.pos.security.RedAvoUserDetails) auth.getPrincipal();
            if (details.getStoreId() != null) {
                return details.getStoreId();
            }
        }
        return DEFAULT_STORE_ID;
    }

    private Long resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.redavo.pos.security.RedAvoUserDetails) {
            com.redavo.pos.security.RedAvoUserDetails details = (com.redavo.pos.security.RedAvoUserDetails) auth.getPrincipal();
            return details.getUserId();
        }
        return null;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<Order> getOrdersToday() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        return orderRepository.findByCreatedAtAfter(startOfDay);
    }

    @Transactional
    public Order confirmOrder(Long id) {
        Order order = orderRepository.findById(id).orElseThrow();
        order.setStatus("CONFIRMED");
        return orderRepository.save(order);
    }

    @Transactional
    public Order fulfilOrder(Long id, String action) { // action = DISPATCHED, DELIVERED, COLLECTED
        Order order = orderRepository.findById(id).orElseThrow();
        
        // Deduct stock if transitioning from CONFIRMED
        if ("CONFIRMED".equalsIgnoreCase(order.getStatus()) && "ONLINE".equalsIgnoreCase(order.getSource())) {
            String actor = resolveActor();
            double totalCogs = 0.0;
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    Double itemCogs = deductStock(item, order, actor);
                    if (itemCogs != null) totalCogs += itemCogs;
                }
            }
            order.setCostOfSale(totalCogs);
        }
        
        order.setStatus(action);
        return orderRepository.save(order);
    }
}
