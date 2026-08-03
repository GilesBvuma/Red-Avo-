package com.redavo.pos.controller;

import com.redavo.pos.dto.FinancialSummaryDTO;
import com.redavo.pos.security.RedAvoUserDetails;
import com.redavo.pos.service.FinancialsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/financials")
public class FinancialsController {

    private final FinancialsService financialsService;

    public FinancialsController(FinancialsService financialsService) {
        this.financialsService = financialsService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FinancialSummaryDTO> getFinancialSummary(
            @AuthenticationPrincipal RedAvoUserDetails user,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        // Default to the user's store if they are not requesting a specific one.
        // If they are an ADMIN, they can query any store, but if storeId is null, we could default to 1L
        Long targetStore = storeId != null ? storeId : (user.getStoreId() != null ? user.getStoreId() : 1L);

        // Default date range: current month to date if not provided
        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now();

        FinancialSummaryDTO summary = financialsService.getFinancialSummary(targetStore, start, end);
        return ResponseEntity.ok(summary);
    }
}
