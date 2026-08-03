package com.redavo.pos.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Returned by all Excel import endpoints.
 * status values: "SUCCESS" | "PARTIAL" | "FAILED"
 * errors format: "Row {n}: {reason}"
 */
@Data
@Builder
public class ImportResultDTO {
    private String batchId;
    private String filename;
    private int totalRows;
    private int successful;
    private int failed;
    private int skipped;
    private String status;       // SUCCESS | PARTIAL | FAILED
    private List<String> errors; // row-level messages: "Row 4: Missing email"
}
