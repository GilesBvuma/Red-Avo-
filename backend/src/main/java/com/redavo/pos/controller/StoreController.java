package com.redavo.pos.controller;

import com.redavo.pos.model.Store;
import com.redavo.pos.repository.StoreRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
public class StoreController {

    private final StoreRepository storeRepository;

    public StoreController(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    @GetMapping
    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Store createStore(@RequestBody Store store) {
        store.setActive(true);
        return storeRepository.save(store);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Store> updateStore(@PathVariable Long id, @RequestBody Store storeDetails) {
        return storeRepository.findById(id).map(store -> {
            store.setName(storeDetails.getName());
            store.setAddress(storeDetails.getAddress());
            store.setRegion(storeDetails.getRegion());
            // Admin can reactivate a closed store
            if (storeDetails.isActive() != null) {
                store.setActive(storeDetails.isActive());
            }
            return ResponseEntity.ok(storeRepository.save(store));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> closeStore(@PathVariable Long id) {
        return storeRepository.findById(id).map(store -> {
            store.setActive(false); // soft-delete
            storeRepository.save(store);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getStoreDashboard(
            @PathVariable Long id,
            @Autowired com.redavo.pos.repository.OrderRepository orderRepository,
            @Autowired com.redavo.pos.repository.UserRepository userRepository) {
        try {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
            java.time.LocalDateTime startOfMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay();

            Double revenueToday = orderRepository.sumTotalByStoreAndPeriod(id, startOfDay, now);
            Double revenueThisMonth = orderRepository.sumTotalByStoreAndPeriod(id, startOfMonth, now);
            Long ordersToday = orderRepository.countOrdersByStoreAndPeriod(id, startOfDay, now);
            Long ordersThisMonth = orderRepository.countOrdersByStoreAndPeriod(id, startOfMonth, now);

            List<Object[]> leaderboardRaw = orderRepository.getEmployeeLeaderboardByStore(id);
            List<java.util.Map<String, Object>> leaderboard = new java.util.ArrayList<>();
            for (Object[] row : leaderboardRaw) {
                Long userId = (Long) row[0];
                Double sales = (Double) row[1];
                String employeeName = "Unknown";
                if (userId != null) {
                    employeeName = userRepository.findById(userId).map(com.redavo.pos.model.User::getFullName).orElse("Unknown");
                }
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("employeeName", employeeName);
                map.put("sales", sales);
                leaderboard.add(map);
            }

            java.util.Map<String, Object> dashboard = new java.util.HashMap<>();
            dashboard.put("revenueToday", revenueToday);
            dashboard.put("revenueThisMonth", revenueThisMonth);
            dashboard.put("ordersToday", ordersToday);
            dashboard.put("ordersThisMonth", ordersThisMonth);
            dashboard.put("leaderboard", leaderboard);

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}
