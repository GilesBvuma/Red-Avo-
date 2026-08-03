package com.redavo.pos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class GiftCardRedeemRequest {
    private String code;
    private BigDecimal amountToRedeem;
    private Long orderId;              // Order being paid — written to ledger
}
