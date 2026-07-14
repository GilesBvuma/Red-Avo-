package com.redavo.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinancialSummaryDTO {
    private Double revenue;
    private Double totalCogs;
    private Double grossProfit;
    private Long orderCount;
}
