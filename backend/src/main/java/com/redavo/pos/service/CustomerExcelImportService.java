package com.redavo.pos.service;

import com.redavo.pos.dto.CustomerImportRowDTO;
import com.redavo.pos.dto.ImportResultDTO;
import com.redavo.pos.model.Customer;
import com.redavo.pos.repository.CustomerRepository;
import org.apache.poi.ss.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Parses and upserts customer records from a client-supplied .xlsx file.
 *
 * <h3>Upsert key</h3>
 * Email address — more reliably present and consistent than Customer ID.
 * Rows with a blank or malformed email are FAILED (not silently skipped).
 *
 * <h3>Business rules</h3>
 * <ul>
 *   <li>lifetimeValue, totalPurchases, firstVisitAt — <b>CREATE-ONLY</b>.
 *       Never overwritten on re-import to protect live POS loyalty data.</li>
 *   <li>lastPurchaseAt — only updated if the imported value is strictly
 *       more recent than the stored value (forward-only).</li>
 *   <li>customerCode — set on create; overwritten on update (non-sensitive).</li>
 * </ul>
 *
 * <h3>Batching</h3>
 * Entities are flushed to the DB every 100 rows to avoid one giant transaction.
 */
@Service
public class CustomerExcelImportService {

    private static final Logger log = LoggerFactory.getLogger(CustomerExcelImportService.class);

    private static final int BATCH_SIZE = 100;
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[\\w._%+\\-]+@[\\w.\\-]+\\.[a-zA-Z]{2,}$"
    );

    // Date/time formats seen in the real client file
    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("M/d/yy h:mm a"),
            DateTimeFormatter.ofPattern("M/d/yyyy h:mm a"),
            DateTimeFormatter.ofPattern("M/d/yy"),
            DateTimeFormatter.ofPattern("M/d/yyyy"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
    );

    private final CustomerRepository customerRepository;

    public CustomerExcelImportService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Entry point
    // ═══════════════════════════════════════════════════════════════

    public ImportResultDTO importFile(MultipartFile file) {
        String batchId = UUID.randomUUID().toString();
        String filename = file.getOriginalFilename();
        List<String> errors = new ArrayList<>();
        int totalRows = 0, successful = 0, failed = 0, skipped = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            // Use first sheet regardless of its name
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                return failResult(batchId, filename, "Excel file has no sheets.");
            }

            // Build header → column index map (case-insensitive, trimmed)
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                return failResult(batchId, filename, "Excel file has no header row.");
            }
            Map<String, Integer> colIndex = buildColumnIndex(headerRow);

            // Collect rows in batches of BATCH_SIZE for incremental flushing
            List<Customer> batch = new ArrayList<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isBlankRow(row)) { skipped++; continue; }
                totalRows++;

                try {
                    CustomerImportRowDTO dto = parseRow(row, colIndex, i + 1, errors);
                    if (dto == null) { failed++; continue; }

                    Customer entity = upsert(dto);
                    batch.add(entity);

                    // Flush batch every BATCH_SIZE rows
                    if (batch.size() >= BATCH_SIZE) {
                        flushBatch(batch);
                        batch.clear();
                    }
                    successful++;
                } catch (Exception e) {
                    failed++;
                    errors.add("Row " + (i + 1) + ": Unexpected error — " + e.getMessage());
                    log.warn("[CustomerImport] Row {} failed: {}", i + 1, e.getMessage());
                }
            }

            // Flush any remaining records
            if (!batch.isEmpty()) flushBatch(batch);

        } catch (Exception e) {
            log.error("[CustomerImport] Fatal parse error: {}", e.getMessage(), e);
            return failResult(batchId, filename, "Could not open/parse Excel file: " + e.getMessage());
        }

        String status = failed == 0 ? "SUCCESS" : (successful == 0 ? "FAILED" : "PARTIAL");
        log.info("[CustomerImport] batchId={} total={} ok={} failed={} skipped={}", batchId, totalRows, successful, failed, skipped);

        return ImportResultDTO.builder()
                .batchId(batchId)
                .filename(filename)
                .totalRows(totalRows)
                .successful(successful)
                .failed(failed)
                .skipped(skipped)
                .status(status)
                .errors(errors)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    //  Column index builder (case-insensitive, trimmed)
    // ═══════════════════════════════════════════════════════════════

    private Map<String, Integer> buildColumnIndex(Row headerRow) {
        Map<String, Integer> map = new HashMap<>();
        for (Cell cell : headerRow) {
            String key = getCellStringValue(cell);
            if (key != null && !key.isBlank()) {
                map.put(key.trim().toLowerCase(), cell.getColumnIndex());
            }
        }
        return map;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Row parser
    // ═══════════════════════════════════════════════════════════════

    private CustomerImportRowDTO parseRow(Row row, Map<String, Integer> cols, int rowNum, List<String> errors) {
        CustomerImportRowDTO dto = new CustomerImportRowDTO();
        dto.setRowNumber(rowNum);

        // Email — required, upsert key
        String email = getString(row, cols, "email");
        if (email == null || email.isBlank()) {
            errors.add("Row " + rowNum + ": Missing email — row skipped.");
            return null;
        }
        email = email.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            errors.add("Row " + rowNum + ": Malformed email '" + email + "' — row skipped.");
            return null;
        }
        dto.setEmail(email);

        // Customer name — required
        String name = getString(row, cols, "customer name");
        if (name == null || name.isBlank()) {
            errors.add("Row " + rowNum + ": Missing customer name — row skipped.");
            return null;
        }
        dto.setFullName(name.trim());

        // Customer ID — ALWAYS read as String to avoid numeric/alphanumeric inconsistency
        dto.setCustomerCode(getStringAlwaysFromCell(row, cols, "customer id"));

        // Phone — read as string preserving exact format; if numeric cell avoid scientific notation
        dto.setPhone(getPhoneString(row, cols, "phone"));

        // Address components
        dto.setAddress(getString(row, cols, "address"));
        dto.setCity(getString(row, cols, "city"));
        dto.setRegion(getString(row, cols, "region"));
        dto.setPostalCode(getString(row, cols, "postal code"));
        dto.setCountry(getString(row, cols, "country"));

        dto.setNotes(getString(row, cols, "note"));

        // Loyalty — CREATE-ONLY (imported value used only for brand-new customers)
        dto.setPointsBalance(getBigDecimal(row, cols, "points balance"));
        dto.setTotalSpent(getBigDecimal(row, cols, "total spent"));
        dto.setTotalVisits(getInteger(row, cols, "total visits"));

        // Timestamps — with robust mixed-type parsing
        dto.setFirstVisitAt(getDate(row, cols, "first visit", rowNum, errors));
        dto.setLastVisitAt(getDate(row, cols, "last visit", rowNum, errors));

        return dto;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Upsert logic
    // ═══════════════════════════════════════════════════════════════

    private Customer upsert(CustomerImportRowDTO dto) {
        Optional<Customer> existing = customerRepository.findByEmail(dto.getEmail());
        Customer customer = existing.orElse(new Customer());
        boolean isNew = existing.isEmpty();

        // Always update safe fields
        String[] nameParts = splitName(dto.getFullName());
        customer.setFirstName(nameParts[0]);
        customer.setLastName(nameParts[1]);
        customer.setEmail(dto.getEmail());

        if (dto.getPhone() != null) customer.setPhoneNumber(dto.getPhone());
        if (dto.getCustomerCode() != null) customer.setCustomerCode(dto.getCustomerCode());

        // Build concatenated address from components
        String fullAddress = buildAddress(dto);
        if (fullAddress != null && !fullAddress.isBlank()) customer.setAddress(fullAddress);
        if (dto.getNotes() != null) customer.setNotes(dto.getNotes());

        if (isNew) {
            // ── CREATE-ONLY fields — set once, never overwritten on re-import ──────────
            // Business rule: these are live loyalty/audit fields managed by the POS.
            // Importing a stale spreadsheet must NEVER wipe out accumulated POS data.

            if (dto.getTotalSpent() != null)
                customer.setLifetimeValue(dto.getTotalSpent().doubleValue());
            if (dto.getTotalVisits() != null)
                customer.setTotalPurchases(dto.getTotalVisits());
            if (dto.getFirstVisitAt() != null)
                customer.setFirstVisitAt(dto.getFirstVisitAt());
            if (dto.getLastVisitAt() != null)
                customer.setLastPurchaseAt(dto.getLastVisitAt());

        } else {
            // ── UPDATE — only forward-update lastPurchaseAt (never move it backward) ──
            if (dto.getLastVisitAt() != null) {
                LocalDateTime stored = customer.getLastPurchaseAt();
                if (stored == null || dto.getLastVisitAt().isAfter(stored)) {
                    customer.setLastPurchaseAt(dto.getLastVisitAt());
                }
            }
            // customerCode is safe to update — not a loyalty/audit field
        }

        return customer;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Batch flush
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    protected void flushBatch(List<Customer> batch) {
        customerRepository.saveAll(batch);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Cell utility methods
    // ═══════════════════════════════════════════════════════════════

    /** Returns the string value of a cell regardless of its type. Handles NUMERIC, STRING, BOOLEAN, FORMULA, BLANK. */
    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue();
            case NUMERIC -> {
                double d = cell.getNumericCellValue();
                // Return as integer string if it is a whole number
                yield (d == Math.floor(d) && !Double.isInfinite(d))
                        ? String.valueOf((long) d)
                        : String.valueOf(d);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield cell.getStringCellValue(); }
                catch (Exception e) {
                    try { yield String.valueOf(cell.getNumericCellValue()); }
                    catch (Exception ex) { yield null; }
                }
            }
            default -> null;
        };
    }

    private String getString(Row row, Map<String, Integer> cols, String colName) {
        Integer idx = cols.get(colName.toLowerCase());
        if (idx == null) return null;
        return getCellStringValue(row.getCell(idx));
    }

    /** Always reads as a plain String even for numeric cells — avoids scientific notation on IDs. */
    private String getStringAlwaysFromCell(Row row, Map<String, Integer> cols, String colName) {
        Integer idx = cols.get(colName.toLowerCase());
        if (idx == null) return null;
        Cell cell = row.getCell(idx);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            // Read numeric ID as a long to avoid floating-point representation
            return String.valueOf((long) cell.getNumericCellValue());
        }
        return getCellStringValue(cell);
    }

    /**
     * Reads phone number safely. If the cell is NUMERIC (common in Excel), reads
     * as a long then converts to String — avoids "2.63E+11" scientific notation.
     */
    private String getPhoneString(Row row, Map<String, Integer> cols, String colName) {
        Integer idx = cols.get(colName.toLowerCase());
        if (idx == null) return null;
        Cell cell = row.getCell(idx);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return String.valueOf((long) cell.getNumericCellValue());
        }
        return getCellStringValue(cell);
    }

    private BigDecimal getBigDecimal(Row row, Map<String, Integer> cols, String colName) {
        Integer idx = cols.get(colName.toLowerCase());
        if (idx == null) return null;
        Cell cell = row.getCell(idx);
        if (cell == null || cell.getCellType() == CellType.BLANK) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) return BigDecimal.valueOf(cell.getNumericCellValue());
            String s = getCellStringValue(cell);
            return (s == null || s.isBlank()) ? null : new BigDecimal(s.trim());
        } catch (NumberFormatException e) { return null; }
    }

    private Integer getInteger(Row row, Map<String, Integer> cols, String colName) {
        BigDecimal bd = getBigDecimal(row, cols, colName);
        return bd == null ? null : bd.intValue();
    }

    /**
     * Parses a date cell that may be:
     * (a) A real Excel date (CellType.NUMERIC + DateUtil.isCellDateFormatted),
     * (b) A text string like "7/15/24 1:09 PM" possibly containing non-breaking
     *     spaces (U+202F / U+00A0) before "AM"/"PM".
     *
     * On parse failure the field is left null and a warning is added — the row is
     * NOT failed just because a date couldn't be parsed.
     */
    private LocalDateTime getDate(Row row, Map<String, Integer> cols, String colName, int rowNum, List<String> errors) {
        Integer idx = cols.get(colName.toLowerCase());
        if (idx == null) return null;
        Cell cell = row.getCell(idx);
        if (cell == null || cell.getCellType() == CellType.BLANK) return null;

        // (a) Real Excel date cell
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            try {
                return cell.getLocalDateTimeCellValue();
            } catch (Exception e) {
                // Fall through to string parse
            }
        }

        // (b) Text date — normalize whitespace including non-breaking spaces
        String raw = getCellStringValue(cell);
        if (raw == null || raw.isBlank()) return null;

        // Replace narrow no-break space (U+202F) and non-breaking space (U+00A0) with regular space
        String normalized = raw.replace('\u202F', ' ').replace('\u00A0', ' ').replaceAll("\\s+", " ").trim();

        for (DateTimeFormatter fmt : DATE_FORMATTERS) {
            try {
                // Try as full date-time first
                return LocalDateTime.parse(normalized, fmt);
            } catch (DateTimeParseException ignored) {
                // Try as date-only by appending midnight time
                try {
                    return java.time.LocalDate.parse(normalized, fmt).atStartOfDay();
                } catch (DateTimeParseException ignored2) {}
            }
        }

        // Don't fail the row — just warn
        errors.add("Row " + rowNum + ": Could not parse '" + colName + "' date value '" + raw + "' — field set to null.");
        return null;
    }

    private boolean isBlankRow(Row row) {
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = getCellStringValue(cell);
                if (val != null && !val.isBlank()) return false;
            }
        }
        return true;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Helpers
    // ═══════════════════════════════════════════════════════════════

    /** Splits a full name into [firstName, lastName]. Handles single-word names gracefully. */
    private String[] splitName(String fullName) {
        if (fullName == null || fullName.isBlank()) return new String[]{"", ""};
        int spaceIdx = fullName.indexOf(' ');
        if (spaceIdx < 0) return new String[]{fullName, ""};
        return new String[]{fullName.substring(0, spaceIdx), fullName.substring(spaceIdx + 1).trim()};
    }

    /** Concatenates address components into one readable string, skipping blanks. */
    private String buildAddress(CustomerImportRowDTO dto) {
        StringJoiner sj = new StringJoiner(", ");
        if (dto.getAddress()    != null && !dto.getAddress().isBlank())    sj.add(dto.getAddress().trim());
        if (dto.getCity()       != null && !dto.getCity().isBlank())       sj.add(dto.getCity().trim());
        if (dto.getRegion()     != null && !dto.getRegion().isBlank())     sj.add(dto.getRegion().trim());
        if (dto.getPostalCode() != null && !dto.getPostalCode().isBlank()) sj.add(dto.getPostalCode().trim());
        if (dto.getCountry()    != null && !dto.getCountry().isBlank())    sj.add(dto.getCountry().trim());
        return sj.toString();
    }

    private ImportResultDTO failResult(String batchId, String filename, String reason) {
        return ImportResultDTO.builder()
                .batchId(batchId).filename(filename)
                .totalRows(0).successful(0).failed(0).skipped(0)
                .status("FAILED")
                .errors(List.of(reason))
                .build();
    }
}
