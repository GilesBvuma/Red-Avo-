package com.redavo.pos.service;

import com.redavo.pos.dto.ImportResultDTO;
import com.redavo.pos.dto.InventoryImportRowDTO;
import com.redavo.pos.model.Product;
import com.redavo.pos.model.ProductVariant;
import com.redavo.pos.repository.ProductRepository;
import com.redavo.pos.repository.ProductVariantRepository;
import org.apache.poi.ss.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses and upserts products and their variants from a client-supplied .xlsx file.
 *
 * <h3>Structure</h3>
 * Rows are grouped by {@code Handle}. The first row of each Handle group contains
 * the product's Name / Category / Description; subsequent rows in the same group
 * leave these blank. A "fill-down" mechanism propagates the last seen values.
 *
 * <h3>Multi-location stock</h3>
 * The file contains store-specific stock columns in the format "In stock [Store Name]".
 * Because the import file does not contain database store IDs, stock from ALL detected
 * locations is SUMMED into {@code ProductVariant.stockQuantity}.
 * This is a deliberate simplification — data is not lost, it is aggregated.
 * Per-store stock levels can be split manually post-import if needed.
 *
 * <h3>Negative stock</h3>
 * Negative "In stock" values (oversold items) are valid and imported as-is.
 * They are NOT clamped to 0.
 *
 * <h3>Upsert key</h3>
 * {@code ProductVariant.sku} — always read as a String (avoids scientific notation).
 *
 * <h3>Batching</h3>
 * Products are flushed to the DB every 100 variants to avoid one giant transaction.
 */
@Service
public class InventoryExcelImportService {

    private static final Logger log = LoggerFactory.getLogger(InventoryExcelImportService.class);
    private static final int BATCH_SIZE = 100;

    // Detects "In stock [Location Name]" — location name captured in group 1
    private static final Pattern STOCK_LOCATION_PATTERN = Pattern.compile("in stock \\[(.+)]$", Pattern.CASE_INSENSITIVE);
    private static final Pattern LOW_STOCK_PATTERN      = Pattern.compile("low stock \\[(.+)]$", Pattern.CASE_INSENSITIVE);
    private static final Pattern PRICE_PATTERN          = Pattern.compile("price \\[(.+)]$", Pattern.CASE_INSENSITIVE);

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    public InventoryExcelImportService(ProductRepository productRepository,
                                       ProductVariantRepository productVariantRepository) {
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Entry point
    // ═══════════════════════════════════════════════════════════════

    public ImportResultDTO importFile(MultipartFile file) {
        String batchId = UUID.randomUUID().toString();
        String filename = file.getOriginalFilename();
        List<String> errors = new ArrayList<>();
        int totalRows = 0, successful = 0, failed = 0, skipped = 0;

        try (java.io.InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) return failResult(batchId, filename, "Excel file has no sheets.");

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return failResult(batchId, filename, "Excel file has no header row.");

            Map<String, Integer> colIndex = buildColumnIndex(headerRow);

            // Detect stock location columns dynamically (e.g. "In stock [RedAvo Activewear]")
            List<Integer> stockCols    = detectLocationColumns(headerRow, STOCK_LOCATION_PATTERN);
            List<Integer> lowStockCols = detectLocationColumns(headerRow, LOW_STOCK_PATTERN);

            // Fill-down state — tracks last non-blank product-level fields across rows
            String lastHandle = null, lastName = null, lastCategory = null, lastDesc = null;

            List<ProductVariant> variantBatch = new ArrayList<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isBlankRow(row)) { skipped++; continue; }
                totalRows++;

                try {
                    InventoryImportRowDTO dto = parseRow(row, colIndex, stockCols, lowStockCols, i + 1, errors);
                    if (dto == null) { failed++; continue; }

                    // ── Fill-down logic ────────────────────────────────────────────────
                    // Business rule: Only the FIRST row of a Handle group has Name/Category/Description.
                    // Blank values in subsequent rows inherit from the previous filled row.
                    String handle = dto.getHandle();
                    if (handle != null && !handle.isBlank()) lastHandle = handle;
                    if (dto.getProductName() != null && !dto.getProductName().isBlank()) lastName     = dto.getProductName();
                    if (dto.getCategory()    != null && !dto.getCategory().isBlank())    lastCategory = dto.getCategory();
                    if (dto.getDescription() != null && !dto.getDescription().isBlank()) lastDesc     = dto.getDescription();

                    dto.setHandle(lastHandle);
                    dto.setProductName(lastName);
                    dto.setCategory(lastCategory);
                    dto.setDescription(lastDesc);

                    if (dto.getSku() == null || dto.getSku().isBlank()) {
                        errors.add("Row " + (i + 1) + ": Missing SKU — row skipped.");
                        failed++;
                        continue;
                    }

                    // Upsert the variant (and its parent product)
                    ProductVariant variant = upsertVariant(dto, errors);
                    variantBatch.add(variant);

                    if (variantBatch.size() >= BATCH_SIZE) {
                        flushBatch(variantBatch);
                        variantBatch.clear();
                    }
                    successful++;
                } catch (Exception e) {
                    failed++;
                    errors.add("Row " + (i + 1) + ": Unexpected error — " + e.getMessage());
                    log.warn("[InventoryImport] Row {} failed: {}", i + 1, e.getMessage());
                }
            }

            if (!variantBatch.isEmpty()) flushBatch(variantBatch);

        } catch (Exception e) {
            log.error("[InventoryImport] Fatal parse error: {}", e.getMessage(), e);
            return failResult(batchId, filename, "Could not open/parse Excel file: " + e.getMessage());
        }

        String status = failed == 0 ? "SUCCESS" : (successful == 0 ? "FAILED" : "PARTIAL");
        log.info("[InventoryImport] batchId={} total={} ok={} failed={} skipped={}", batchId, totalRows, successful, failed, skipped);

        return ImportResultDTO.builder()
                .batchId(batchId).filename(filename)
                .totalRows(totalRows).successful(successful)
                .failed(failed).skipped(skipped)
                .status(status).errors(errors)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    //  Column index builder
    // ═══════════════════════════════════════════════════════════════

    private Map<String, Integer> buildColumnIndex(Row headerRow) {
        Map<String, Integer> map = new HashMap<>();
        for (Cell cell : headerRow) {
            String key = getCellStringValue(cell);
            if (key != null && !key.isBlank()) map.put(key.trim().toLowerCase(), cell.getColumnIndex());
        }
        return map;
    }

    /** Finds all column indices matching the given bracketed-location pattern. */
    private List<Integer> detectLocationColumns(Row headerRow, Pattern pattern) {
        List<Integer> indices = new ArrayList<>();
        for (Cell cell : headerRow) {
            String header = getCellStringValue(cell);
            if (header == null) continue;
            if (pattern.matcher(header.trim()).find()) {
                indices.add(cell.getColumnIndex());
            }
        }
        return indices;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Row parser
    // ═══════════════════════════════════════════════════════════════

    private InventoryImportRowDTO parseRow(Row row, Map<String, Integer> cols,
                                           List<Integer> stockCols, List<Integer> lowStockCols,
                                           int rowNum, List<String> errors) {
        InventoryImportRowDTO dto = new InventoryImportRowDTO();
        dto.setRowNumber(rowNum);

        dto.setHandle(getString(row, cols, "handle"));
        dto.setProductName(getString(row, cols, "name"));
        dto.setCategory(getString(row, cols, "category"));
        dto.setDescription(getString(row, cols, "description"));

        // SKU — always read as String to avoid numeric -> scientific notation
        dto.setSku(getStringAlwaysFromCell(row, cols, "sku"));
        dto.setBarcode(getString(row, cols, "barcode"));

        // Variant options
        dto.setOption1Name(getString(row, cols, "option 1 name"));
        dto.setOption1Value(getString(row, cols, "option 1 value"));
        dto.setOption2Name(getString(row, cols, "option 2 name"));
        dto.setOption2Value(getString(row, cols, "option 2 value"));
        dto.setOption3Name(getString(row, cols, "option 3 name"));
        dto.setOption3Value(getString(row, cols, "option 3 value"));

        // Pricing
        dto.setDefaultPrice(getBigDecimal(row, cols, "default price"));
        dto.setCost(getBigDecimal(row, cols, "cost"));

        // Track stock flag
        String trackStockVal = getString(row, cols, "track stock");
        dto.setTrackStock("Y".equalsIgnoreCase(trackStockVal) || "yes".equalsIgnoreCase(trackStockVal) || "true".equalsIgnoreCase(trackStockVal));

        // Stock — SUM across all detected locations (deliberate simplification)
        // Business rule: file has store names, not IDs. Summing preserves total on-hand quantity.
        // Negative values (oversold) are imported as-is — do NOT clamp to 0.
        int totalStock = 0;
        for (Integer colIdx : stockCols) {
            Cell cell = row.getCell(colIdx);
            BigDecimal val = getCellBigDecimal(cell);
            if (val != null) totalStock += val.intValue();
        }
        dto.setTotalStock(totalStock);

        // Low stock threshold — use first location's value as the threshold
        if (!lowStockCols.isEmpty()) {
            BigDecimal ls = getCellBigDecimal(row.getCell(lowStockCols.get(0)));
            if (ls != null) dto.setLowStockThreshold(ls.intValue());
        }

        // Bundle items warning
        String includedSku = getString(row, cols, "sku of included item");
        if (includedSku != null && !includedSku.isBlank()) {
            dto.setHasBundleItems(true);
            errors.add("Row " + rowNum + ": Warning — row has bundle items (SKU: " + dto.getSku() + "). Bundle logic not imported.");
        }

        return dto;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Upsert logic
    // ═══════════════════════════════════════════════════════════════

    private ProductVariant upsertVariant(InventoryImportRowDTO dto, List<String> errors) {
        Optional<ProductVariant> existingVariant = productVariantRepository.findBySku(dto.getSku());

        if (existingVariant.isPresent()) {
            // UPDATE existing variant — update stock, prices, active state
            ProductVariant v = existingVariant.get();
            if (dto.getDefaultPrice() != null) v.setSellPrice(dto.getDefaultPrice());
            if (dto.getCost()         != null) v.setCostPrice(dto.getCost());
            v.setStockQuantity(dto.getTotalStock()); // stock is always overwritten on update
            if (dto.getOption1Value() != null) v.setColor(dto.getOption1Value());
            if (dto.getOption2Value() != null) v.setSize(dto.getOption2Value());

            // Also update the parent product's metadata
            Product p = v.getProduct();
            if (dto.getProductName() != null && !dto.getProductName().isBlank()) p.setName(dto.getProductName());
            if (dto.getCategory()    != null && !dto.getCategory().isBlank())    p.setCategory(dto.getCategory());
            if (dto.getDescription() != null && !dto.getDescription().isBlank()) p.setDescription(dto.getDescription());
            if (dto.getDefaultPrice() != null) p.setPrice(dto.getDefaultPrice().doubleValue());
            if (dto.getLowStockThreshold() != null) p.setLowStockThreshold(dto.getLowStockThreshold());
            productRepository.save(p);

            return v;

        } else {
            // CREATE: find or create parent Product by Handle, then create variant

            // Find an existing product with the same name (case-insensitive) or create new
            String productName = dto.getProductName() != null ? dto.getProductName().trim() : dto.getSku();

            Product product = productRepository.findByCategoryIgnoreCase(dto.getCategory() != null ? dto.getCategory() : "")
                    .stream()
                    .filter(p -> p.getName().equalsIgnoreCase(productName))
                    .findFirst()
                    .orElseGet(() -> {
                        Product newProduct = new Product();
                        newProduct.setName(productName);
                        newProduct.setCategory(dto.getCategory());
                        newProduct.setDescription(dto.getDescription());
                        newProduct.setPrice(dto.getDefaultPrice() != null ? dto.getDefaultPrice().doubleValue() : 0.0);
                        newProduct.setSku(dto.getSku()); // Product-level SKU from first variant
                        newProduct.setStockQuantity(0);  // Maintained via variants
                        newProduct.setLowStockThreshold(dto.getLowStockThreshold() != null ? dto.getLowStockThreshold() : 5);
                        newProduct.setIsActive(true);
                        return productRepository.save(newProduct);
                    });

            ProductVariant v = new ProductVariant();
            v.setProduct(product);
            v.setSku(dto.getSku());
            v.setColor(dto.getOption1Value());
            v.setSize(dto.getOption2Value());
            v.setSellPrice(dto.getDefaultPrice() != null ? dto.getDefaultPrice() : BigDecimal.ZERO);
            v.setCostPrice(dto.getCost() != null ? dto.getCost() : BigDecimal.ZERO);
            v.setStockQuantity(dto.getTotalStock());
            v.setActive(true);

            return v;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  Batch flush
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    protected void flushBatch(List<ProductVariant> batch) {
        productVariantRepository.saveAll(batch);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Cell utility methods
    // ═══════════════════════════════════════════════════════════════

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue();
            case NUMERIC -> {
                double d = cell.getNumericCellValue();
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

    private String getStringAlwaysFromCell(Row row, Map<String, Integer> cols, String colName) {
        Integer idx = cols.get(colName.toLowerCase());
        if (idx == null) return null;
        Cell cell = row.getCell(idx);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf((long) cell.getNumericCellValue());
        return getCellStringValue(cell);
    }

    private BigDecimal getBigDecimal(Row row, Map<String, Integer> cols, String colName) {
        Integer idx = cols.get(colName.toLowerCase());
        if (idx == null) return null;
        return getCellBigDecimal(row.getCell(idx));
    }

    private BigDecimal getCellBigDecimal(Cell cell) {
        if (cell == null || cell.getCellType() == CellType.BLANK) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) return BigDecimal.valueOf(cell.getNumericCellValue());
            String s = getCellStringValue(cell);
            return (s == null || s.isBlank()) ? null : new BigDecimal(s.trim());
        } catch (NumberFormatException e) { return null; }
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

    private ImportResultDTO failResult(String batchId, String filename, String reason) {
        return ImportResultDTO.builder()
                .batchId(batchId).filename(filename)
                .totalRows(0).successful(0).failed(0).skipped(0)
                .status("FAILED").errors(List.of(reason)).build();
    }
}
