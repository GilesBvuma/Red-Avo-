package com.redavo.pos.repository;

import com.redavo.pos.model.StockTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    List<StockTransfer> findByFromStoreIdOrToStoreIdOrderByRequestedAtDesc(Long fromStoreId, Long toStoreId);
    List<StockTransfer> findByFromStoreIdOrderByRequestedAtDesc(Long fromStoreId);
    List<StockTransfer> findByToStoreIdOrderByRequestedAtDesc(Long toStoreId);
}
