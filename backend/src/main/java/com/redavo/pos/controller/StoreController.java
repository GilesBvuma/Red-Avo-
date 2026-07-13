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
}
