package com.redavo.pos.repository;

import com.redavo.pos.model.LedgerReason;
import com.redavo.pos.model.StockLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockLedgerRepository extends JpaRepository<StockLedger, Long> {

    List<StockLedger> findByVariantIdAndStoreIdOrderByRecordedAtDesc(Long variantId, Long storeId);

    List<StockLedger> findByStoreIdOrderByRecordedAtDesc(Long storeId);

    List<StockLedger> findByReasonCodeAndRecordedAtAfter(LedgerReason reason, LocalDateTime after);

    /** Total delta sum — the source of truth for current stock at a variant+store. */
    @Query("""
        SELECT COALESCE(SUM(sl.quantityDelta), 0)
        FROM StockLedger sl
        WHERE sl.variant.id = :variantId AND sl.storeId = :storeId
        """)
    int sumDeltaByVariantAndStore(@Param("variantId") Long variantId,
                                  @Param("storeId") Long storeId);

    /**
     * COGS query: sum of (cost_price × abs(quantity_delta)) for SALE entries
     * within a date range. Used by the Financials module (Phase 3).
     */
    @Query("""
        SELECT COALESCE(SUM(sl.quantityDelta * pv.costPrice), 0)
        FROM StockLedger sl
        JOIN sl.variant pv
        WHERE sl.storeId = :storeId
          AND sl.reasonCode = com.redavo.pos.model.LedgerReason.SALE
          AND sl.recordedAt BETWEEN :from AND :to
        """)
    java.math.BigDecimal sumCogsByStoreAndPeriod(@Param("storeId") Long storeId,
                                                 @Param("from") LocalDateTime from,
                                                 @Param("to") LocalDateTime to);
}
