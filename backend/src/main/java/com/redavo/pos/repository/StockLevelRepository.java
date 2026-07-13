package com.redavo.pos.repository;

import com.redavo.pos.model.StockLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockLevelRepository extends JpaRepository<StockLevel, Long> {

    Optional<StockLevel> findByVariantIdAndStoreId(Long variantId, Long storeId);

    List<StockLevel> findByStoreId(Long storeId);

    List<StockLevel> findByVariantId(Long variantId);

    /** Sum of quantity deltas — use to verify the materialised quantity is correct. */
    @Query("""
        SELECT COALESCE(SUM(sl.quantityDelta), 0)
        FROM StockLedger sl
        WHERE sl.variant.id = :variantId AND sl.storeId = :storeId
        """)
    int deriveQuantityFromLedger(@Param("variantId") Long variantId,
                                 @Param("storeId") Long storeId);
}
