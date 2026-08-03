package com.redavo.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class GiftCardPurchaseRequest {
    private Integer tierId;
    private String purchaserName;
    private String purchaserEmail;
    private String recipientName;
    private String recipientEmail;
    private String personalMessage;
    private LocalDate recipientBirthday; // Optional — for birthday reminder
}
