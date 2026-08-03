package com.redavo.pos.controller;

import com.redavo.pos.repository.CustomerRepository;
import com.redavo.pos.repository.ProductRepository;
import com.redavo.pos.service.NotificationService;
import com.redavo.pos.service.OrderService;
import com.redavo.pos.service.ProductService;
import com.redavo.pos.model.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<Order> todaysOrders = orderService.getOrdersToday();

        double salesToday = todaysOrders.stream()
                .mapToDouble(o -> o.getTotal() != null ? o.getTotal() : 0.0)
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProducts",   productRepository.count());
        stats.put("ordersToday",     todaysOrders.size());
        stats.put("totalCustomers",  customerRepository.count());
        stats.put("lowStockCount",   productService.getLowStockProducts().size());
        stats.put("messagesToday",   notificationService.getMessagesSentToday());
        stats.put("salesToday",      salesToday);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/channels")
    public ResponseEntity<Map<String, String>> getChannels() {
        return ResponseEntity.ok(notificationService.getChannelStatus());
    }
}
