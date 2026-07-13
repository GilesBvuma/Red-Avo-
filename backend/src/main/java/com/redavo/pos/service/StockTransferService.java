package com.redavo.pos.service;

import com.redavo.pos.model.*;
import com.redavo.pos.repository.ProductVariantRepository;
import com.redavo.pos.repository.StockTransferRepository;
import com.redavo.pos.repository.StoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StockTransferService {

    private final StockTransferRepository transferRepository;
    private final StoreRepository storeRepository;
    private final ProductVariantRepository variantRepository;
    private final StockLedgerService stockLedgerService;

    public StockTransferService(StockTransferRepository transferRepository,
                                StoreRepository storeRepository,
                                ProductVariantRepository variantRepository,
                                StockLedgerService stockLedgerService) {
        this.transferRepository = transferRepository;
        this.storeRepository = storeRepository;
        this.variantRepository = variantRepository;
        this.stockLedgerService = stockLedgerService;
    }

    public List<StockTransfer> getTransfersForStore(Long storeId) {
        if (storeId == null) {
            return transferRepository.findAll();
        }
        return transferRepository.findByFromStoreIdOrToStoreIdOrderByRequestedAtDesc(storeId, storeId);
    }
    
    public StockTransfer getTransfer(Long id) {
        return transferRepository.findById(id).orElseThrow(() -> new RuntimeException("Transfer not found"));
    }

    @Transactional
    public StockTransfer requestTransfer(Long variantId, Long fromStoreId, Long toStoreId, int quantity, String actor) {
        ProductVariant variant = variantRepository.findById(variantId).orElseThrow(() -> new RuntimeException("Variant not found"));
        Store fromStore = storeRepository.findById(fromStoreId).orElseThrow(() -> new RuntimeException("Source store not found"));
        Store toStore = storeRepository.findById(toStoreId).orElseThrow(() -> new RuntimeException("Dest store not found"));

        if (fromStoreId.equals(toStoreId)) {
            throw new IllegalArgumentException("Cannot transfer to the same store");
        }

        StockTransfer transfer = new StockTransfer();
        transfer.setVariant(variant);
        transfer.setFromStore(fromStore);
        transfer.setToStore(toStore);
        transfer.setRequestedQuantity(quantity);
        transfer.setStatus(TransferStatus.REQUESTED);
        transfer.setRequestedBy(actor);
        
        return transferRepository.save(transfer);
    }

    @Transactional
    public StockTransfer dispatchTransfer(Long transferId, int dispatchQuantity, String actor) {
        StockTransfer transfer = getTransfer(transferId);
        
        if (transfer.getStatus() != TransferStatus.REQUESTED) {
            throw new IllegalStateException("Transfer must be in REQUESTED state to dispatch");
        }

        transfer.setDispatchedQuantity(dispatchQuantity);
        transfer.setStatus(TransferStatus.DISPATCHED);
        transfer.setApprovedBy(actor);
        transfer.setDispatchedAt(LocalDateTime.now());

        // Deduct from source store via ledger (TRANSFER_OUT)
        stockLedgerService.applyDelta(
                transfer.getVariant().getId(), 
                transfer.getFromStore().getId(), 
                -dispatchQuantity, 
                LedgerReason.TRANSFER_OUT, 
                "TX-" + transfer.getId(), 
                actor
        );

        return transferRepository.save(transfer);
    }

    @Transactional
    public StockTransfer receiveTransfer(Long transferId, int receiveQuantity, String actor) {
        StockTransfer transfer = getTransfer(transferId);
        
        if (transfer.getStatus() != TransferStatus.DISPATCHED) {
            throw new IllegalStateException("Transfer must be in DISPATCHED state to receive");
        }

        transfer.setReceivedQuantity(receiveQuantity);
        transfer.setReceivedBy(actor);
        transfer.setReceivedAt(LocalDateTime.now());

        // Add received quantity to destination store via ledger (TRANSFER_IN)
        if (receiveQuantity > 0) {
            stockLedgerService.applyDelta(
                    transfer.getVariant().getId(), 
                    transfer.getToStore().getId(), 
                    receiveQuantity, 
                    LedgerReason.TRANSFER_IN, 
                    "TX-" + transfer.getId(), 
                    actor
            );
        }

        if (receiveQuantity == transfer.getDispatchedQuantity()) {
            transfer.setStatus(TransferStatus.RECEIVED);
        } else {
            // Variance: user approved to add the matched portion immediately, 
            // leaving the transfer in a VARIANCE_PENDING state for Admin sign-off.
            transfer.setStatus(TransferStatus.VARIANCE_PENDING);
        }

        return transferRepository.save(transfer);
    }

    @Transactional
    public StockTransfer resolveVariance(Long transferId, String resolution, String actor) {
        StockTransfer transfer = getTransfer(transferId);
        
        if (transfer.getStatus() != TransferStatus.VARIANCE_PENDING) {
            throw new IllegalStateException("Transfer must be in VARIANCE_PENDING state to resolve");
        }

        int missing = transfer.getDispatchedQuantity() - (transfer.getReceivedQuantity() != null ? transfer.getReceivedQuantity() : 0);
        
        if ("WRITE_OFF".equalsIgnoreCase(resolution)) {
            // The missing stock is gone. It was already deducted from source during dispatch.
            // We just log a WRITE_OFF ledger entry on the destination store for zero quantity to record the event?
            // Actually, a write-off means it's lost in transit.
            transfer.setVarianceReason("Written off missing quantity: " + missing);
        } else if ("RETURN".equalsIgnoreCase(resolution)) {
            // Return missing stock to source store (maybe they never sent it)
            stockLedgerService.applyDelta(
                    transfer.getVariant().getId(), 
                    transfer.getFromStore().getId(), 
                    missing, 
                    LedgerReason.TRANSFER_IN, 
                    "TX-RESOLVE-" + transfer.getId(), 
                    actor
            );
            transfer.setVarianceReason("Returned missing quantity (" + missing + ") to source store");
        } else {
            throw new IllegalArgumentException("Unknown resolution type: " + resolution);
        }

        transfer.setStatus(TransferStatus.RESOLVED);
        transfer.setResolvedBy(actor);
        transfer.setResolvedAt(LocalDateTime.now());

        return transferRepository.save(transfer);
    }
}
