package com.redavo.pos.controller;

import com.redavo.pos.model.StockTransfer;
import com.redavo.pos.security.RedAvoUserDetails;
import com.redavo.pos.service.StockTransferService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
    public List<StockTransfer> getTransfers(Authentication auth) {
        RedAvoUserDetails user = (RedAvoUserDetails) auth.getPrincipal();
        return transferService.getTransfersForStore(user.getStoreId());
    }

    @PostMapping("/request")
    public StockTransfer requestTransfer(@RequestBody Map<String, Object> body, Authentication auth) {
        Long variantId = Long.valueOf(body.get("variantId").toString());
        Long fromStoreId = Long.valueOf(body.get("fromStoreId").toString());
        Long toStoreId = Long.valueOf(body.get("toStoreId").toString());
        int quantity = Integer.parseInt(body.get("quantity").toString());

        return transferService.requestTransfer(variantId, fromStoreId, toStoreId, quantity, auth.getName());
    }

    @PostMapping("/{id}/dispatch")
    public StockTransfer dispatchTransfer(@PathVariable Long id, @RequestBody Map<String, Integer> body, Authentication auth) {
        int dispatchQuantity = body.get("dispatchQuantity");
        return transferService.dispatchTransfer(id, dispatchQuantity, auth.getName());
    }

    @PostMapping("/{id}/receive")
    public StockTransfer receiveTransfer(@PathVariable Long id, @RequestBody Map<String, Integer> body, Authentication auth) {
        int receiveQuantity = body.get("receiveQuantity");
        return transferService.receiveTransfer(id, receiveQuantity, auth.getName());
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public StockTransfer resolveVariance(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        String resolution = body.get("resolution"); // "WRITE_OFF" or "RETURN"
        return transferService.resolveVariance(id, resolution, auth.getName());
    }
}
