package com.redavo.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeStatsDTO {
    private Long employeeId;
    private Long totalOrders;
    private Double totalSales;
    private Long ordersToday;
    private Double salesToday;
    private Double salesThisMonth;
    private Double averageTransactionValue;
}
