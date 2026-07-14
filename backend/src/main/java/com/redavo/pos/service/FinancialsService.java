package com.redavo.pos.service;

import com.redavo.pos.dto.FinancialSummaryDTO;
import com.redavo.pos.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class FinancialsService {

    private final OrderRepository orderRepository;

    public FinancialsService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public FinancialSummaryDTO getFinancialSummary(Long storeId, LocalDateTime from, LocalDateTime to) {
        Double revenue = orderRepository.sumTotalByStoreAndPeriod(storeId, from, to);
        Double cogs = orderRepository.sumCogsByStoreAndPeriod(storeId, from, to);
        Long orderCount = orderRepository.countOrdersByStoreAndPeriod(storeId, from, to);

        Double grossProfit = revenue - cogs;

        return new FinancialSummaryDTO(revenue, cogs, grossProfit, orderCount);
    }
}
