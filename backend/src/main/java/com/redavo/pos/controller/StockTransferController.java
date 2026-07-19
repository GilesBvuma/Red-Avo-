package com.redavo.pos.controller;

import com.redavo.pos.model.StockTransfer;
import com.redavo.pos.security.RedAvoUserDetails;
import com.redavo.pos.service.StockTransferService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stock/transfers")
public class StockTransferController {

    private final StockTransferService transferService;

    public StockTransferController(StockTransferService transferService) {
        this.transferService = transferService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<StockTransfer> getTransfers(@AuthenticationPrincipal RedAvoUserDetails user) {
        // ADMIN: storeId is null → getTransfersForStore(null) returns all transfers
        // EMPLOYEE: storeId is set → returns only their store's transfers
        return transferService.getTransfersForStore(user != null ? user.getStoreId() : null);
    }

    @PostMapping("/request")
    @PreAuthorize("isAuthenticated()")
    public StockTransfer requestTransfer(@RequestBody java.util.Map<String, Object> body,
                                         @AuthenticationPrincipal RedAvoUserDetails user) {
        Long variantId   = Long.valueOf(body.get("variantId").toString());
        Long fromStoreId = Long.valueOf(body.get("fromStoreId").toString());
        Long toStoreId   = Long.valueOf(body.get("toStoreId").toString());
        int  quantity    = Integer.parseInt(body.get("quantity").toString());
        return transferService.requestTransfer(variantId, fromStoreId, toStoreId, quantity,
                user != null ? user.getUsername() : "system");
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasRole('ADMIN')")
    public StockTransfer dispatchTransfer(@PathVariable Long id,
                                          @RequestBody java.util.Map<String, Integer> body,
                                          @AuthenticationPrincipal RedAvoUserDetails user) {
        int dispatchQuantity = body.get("dispatchQuantity");
        return transferService.dispatchTransfer(id, dispatchQuantity,
                user != null ? user.getUsername() : "system");
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("isAuthenticated()")
    public StockTransfer receiveTransfer(@PathVariable Long id,
                                         @RequestBody java.util.Map<String, Integer> body,
                                         @AuthenticationPrincipal RedAvoUserDetails user) {
        int receiveQuantity = body.get("receiveQuantity");
        return transferService.receiveTransfer(id, receiveQuantity,
                user != null ? user.getUsername() : "system");
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public StockTransfer resolveVariance(@PathVariable Long id,
                                         @RequestBody Map<String, String> body,
                                         @AuthenticationPrincipal RedAvoUserDetails user) {
        String resolution = body.get("resolution"); // "WRITE_OFF" or "RETURN"
        return transferService.resolveVariance(id, resolution,
                user != null ? user.getUsername() : "system");
    }
}
