package com.redavo.pos.controller;

import com.redavo.pos.model.User;
import com.redavo.pos.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final UserService userService;
    private final com.redavo.pos.repository.OrderRepository orderRepository;

    public EmployeeController(UserService userService, com.redavo.pos.repository.OrderRepository orderRepository) {
        this.userService = userService;
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<User> getAllEmployees() {
        return userService.getAllUsers();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<User> deactivateEmployee(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(userService.deactivateUser(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> updateEmployeePassword(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        return userService.findById(id).map(user -> {
            String newPassword = payload.get("newPassword");
            if (newPassword == null || newPassword.isBlank()) {
                return ResponseEntity.badRequest().body("New password is required");
            }
            userService.updatePassword(user.getEmail(), newPassword);
            return ResponseEntity.ok().build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<?> getEmployeeStats(
            @PathVariable Long id) {
        try {
            Long totalOrders = orderRepository.countByUserId(id);
            Double totalSales = orderRepository.sumTotalByUserId(id);

            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
            java.time.LocalDateTime startOfMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay();

            Long ordersToday = orderRepository.countOrdersByUserIdAndPeriod(id, startOfDay, now);
            Double salesToday = orderRepository.sumTotalByUserIdAndPeriod(id, startOfDay, now);
            Double salesThisMonth = orderRepository.sumTotalByUserIdAndPeriod(id, startOfMonth, now);
            
            Double atv = 0.0;
            if (totalOrders != null && totalOrders > 0 && totalSales != null) {
                atv = totalSales / totalOrders;
            }

            return ResponseEntity.ok(new com.redavo.pos.dto.EmployeeStatsDTO(id, totalOrders, totalSales, ordersToday, salesToday, salesThisMonth, atv));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage() + " - " + e.getClass().getName());
        }
    }

    @GetMapping("/{id}/recent-sales")
    public ResponseEntity<?> getRecentSales(@PathVariable Long id) {
        try {
            List<com.redavo.pos.model.Order> recentOrders = orderRepository.findTop10ByUserIdOrderByCreatedAtDesc(id);
            return ResponseEntity.ok(recentOrders);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage() + " - " + e.getClass().getName());
        }
    }
}
