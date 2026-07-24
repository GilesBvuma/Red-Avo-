package com.redavo.pos.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.*;
import com.redavo.pos.model.Order;
import com.redavo.pos.model.OrderItem;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

/**
 * InvoiceService — generates a fiscalized-style tax invoice PDF for each order.
 *
 * The invoice is designed to meet the general structure of a Zimbabwe ZIMRA
 * compliant fiscal tax invoice. For full ZIMRA compliance, you will need to
 * register your fiscal device and obtain a device serial number.
 *
 * Fields included:
 * - Sequential invoice number (INV-YYYY-NNNN)
 * - Business details (name, address, VAT reg number)
 * - Customer details
 * - Line items with unit price, VAT amount, line total
 * - VAT breakdown (15% standard rate)
 * - Grand total
 * - Payment method + change
 * - "FISCAL TAX INVOICE" designation
 */
@Service
public class InvoiceService {

        private final com.redavo.pos.repository.ProductRepository productRepository;

        @org.springframework.beans.factory.annotation.Autowired
        public InvoiceService(com.redavo.pos.repository.ProductRepository productRepository) {
                this.productRepository = productRepository;
        }

        // ── Brand colours ────────────────────────────────────────────
        private static final DeviceRgb RED_AVO_GREEN = new DeviceRgb(126, 176, 60); // #7EB03C
        private static final DeviceRgb DARK_RED = new DeviceRgb(0x8B, 0x00, 0x00);
        private static final DeviceRgb BLACK = new DeviceRgb(0x1A, 0x1A, 0x1A);
        private static final DeviceRgb LIGHT_GREY = new DeviceRgb(0xF5, 0xF5, 0xF5);
        private static final DeviceRgb MID_GREY = new DeviceRgb(0xDD, 0xDD, 0xDD);

        // ── Business constants — update with real details ─────────────
        private static final String BUSINESS_NAME = "Red Avo Sportswear (Pvt) Ltd";
        private static final String BUSINESS_ADDRESS = "123 Borrowdale Road, Harare, Zimbabwe";
        private static final String BUSINESS_PHONE = "+263 717 709 520";
        private static final String BUSINESS_EMAIL = "sales@redavowear.com";
        private static final String BUSINESS_WEBSITE = "www.redavowear.com";
        private static final String VAT_REG_NUMBER = "VP-2024-0001"; // replace with real ZIMRA VAT number
        private static final String BP_NUMBER = "2024123456"; // ZIMRA BP number

        public byte[] generateInvoice(Order order) {
                try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

                        PdfWriter writer = new PdfWriter(baos);
                        PdfDocument pdf = new PdfDocument(writer);
                        Document document = new Document(pdf, PageSize.A4);
                        document.setMargins(30, 40, 30, 40);

                        PdfFont bold = PdfFontFactory
                                        .createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD);
                        PdfFont regular = PdfFontFactory
                                        .createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA);
                        PdfFont mono = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.COURIER);

                        // ══════════════════════════════════════════════════════
                        // HEADER — Logo area + FISCAL TAX INVOICE
                        // ══════════════════════════════════════════════════════
                        Table header = new Table(UnitValue.createPercentArray(new float[] { 60, 40 }))
                                        .setWidth(UnitValue.createPercentValue(100))
                                        .setMarginBottom(6);

                        // Left: Business info
                        Cell bizCell = new Cell().setBorder(Border.NO_BORDER).setPadding(0);
                        
                        try (java.io.InputStream is = getClass().getResourceAsStream("/logo.png")) {
                                if (is != null) {
                                        byte[] imageBytes = is.readAllBytes();
                                        com.itextpdf.layout.element.Image topLogo = new com.itextpdf.layout.element.Image(
                                                        com.itextpdf.io.image.ImageDataFactory.create(imageBytes))
                                                        .scaleToFit(80, 80);
                                        topLogo.setMarginBottom(5);
                                        bizCell.add(topLogo);
                                } else {
                                        bizCell.add(new Paragraph("RED AVO")
                                                        .setFont(bold).setFontSize(22).setFontColor(RED_AVO_GREEN).setMarginBottom(1));
                                }
                        } catch (Exception e) {
                                bizCell.add(new Paragraph("RED AVO")
                                                .setFont(bold).setFontSize(22).setFontColor(RED_AVO_GREEN).setMarginBottom(1));
                        }
                        bizCell.add(new Paragraph(BUSINESS_NAME)
                                        .setFont(bold).setFontSize(9).setFontColor(BLACK).setMarginBottom(1));
                        bizCell.add(new Paragraph(BUSINESS_ADDRESS)
                                        .setFont(regular).setFontSize(8).setFontColor(BLACK));
                        bizCell.add(new Paragraph("Tel: " + BUSINESS_PHONE + "  |  " + BUSINESS_EMAIL)
                                        .setFont(regular).setFontSize(8).setFontColor(BLACK));
                        bizCell.add(new Paragraph("VAT Reg: " + VAT_REG_NUMBER + "  |  BP: " + BP_NUMBER)
                                        .setFont(bold).setFontSize(8).setFontColor(BLACK));
                        header.addCell(bizCell);

                        // Right: Invoice type + number
                        Cell invTypeCell = new Cell().setBorder(Border.NO_BORDER)
                                        .setTextAlignment(TextAlignment.RIGHT).setPadding(0);
                        invTypeCell.add(new Paragraph("FISCAL TAX INVOICE")
                                        .setFont(bold).setFontSize(14).setFontColor(RED_AVO_GREEN).setMarginBottom(3));
                        invTypeCell.add(new Paragraph(order.getInvoiceNumber() != null ? order.getInvoiceNumber()
                                        : "INV-" + order.getId())
                                        .setFont(bold).setFontSize(11).setFontColor(BLACK).setMarginBottom(3));
                        if (order.getCreatedAt() != null) {
                                invTypeCell.add(new Paragraph("Date: " + order.getCreatedAt()
                                                .format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm")))
                                                .setFont(regular).setFontSize(9).setFontColor(BLACK));
                        }
                        invTypeCell.add(new Paragraph("Order Ref: ORD-" + order.getId())
                                        .setFont(regular).setFontSize(9).setFontColor(BLACK));
                        invTypeCell.add(new Paragraph("Status: PAID ✓")
                                        .setFont(bold).setFontSize(9).setFontColor(new DeviceRgb(0x16, 0xA3, 0x4A)));
                        header.addCell(invTypeCell);

                        document.add(header);

                        // Red divider
                        document.add(new LineSeparator(new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(1.5f))
                                        .setStrokeColor(RED_AVO_GREEN).setMarginBottom(8));

                        // ══════════════════════════════════════════════════════
                        // CUSTOMER & PAYMENT INFO
                        // ══════════════════════════════════════════════════════
                        Table infoTable = new Table(UnitValue.createPercentArray(new float[] { 50, 50 }))
                                        .setWidth(UnitValue.createPercentValue(100))
                                        .setMarginBottom(12);

                        Cell custCell = new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                                        .setBackgroundColor(LIGHT_GREY);
                        custCell.add(new Paragraph("BILL TO").setFont(bold).setFontSize(8)
                                        .setFontColor(RED_AVO_GREEN).setMarginBottom(3));
                        custCell.add(new Paragraph(
                                        order.getCustomerName() != null ? order.getCustomerName() : "Walk-in Customer")
                                        .setFont(bold).setFontSize(10).setMarginBottom(1));
                        if (order.getCustomerEmail() != null && !order.getCustomerEmail().isBlank()) {
                                custCell.add(new Paragraph(order.getCustomerEmail()).setFont(regular).setFontSize(9));
                        }
                        if (order.getCustomerPhone() != null && !order.getCustomerPhone().isBlank()) {
                                custCell.add(new Paragraph(order.getCustomerPhone()).setFont(regular).setFontSize(9));
                        }
                        infoTable.addCell(custCell);

                        Cell payCell = new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                                        .setBackgroundColor(LIGHT_GREY);
                        payCell.add(new Paragraph("PAYMENT").setFont(bold).setFontSize(8)
                                        .setFontColor(RED_AVO_GREEN).setMarginBottom(3));
                        payCell.add(new Paragraph("Method: "
                                        + (order.getPaymentMethod() != null ? order.getPaymentMethod() : "CASH"))
                                        .setFont(regular).setFontSize(9).setMarginBottom(1));
                        if (order.getAmountTendered() != null && order.getAmountTendered() > 0) {
                                payCell.add(new Paragraph(String.format("Tendered: $%.2f", order.getAmountTendered()))
                                                .setFont(regular).setFontSize(9));
                                payCell.add(new Paragraph(String.format("Change:   $%.2f",
                                                order.getChangeGiven() != null ? order.getChangeGiven() : 0))
                                                .setFont(regular).setFontSize(9));
                        }
                        infoTable.addCell(payCell);

                        document.add(infoTable);

                        // ══════════════════════════════════════════════════════
                        // LINE ITEMS TABLE
                        // ══════════════════════════════════════════════════════
                        Table itemsTable = new Table(
                                        UnitValue.createPercentArray(new float[] { 35, 8, 16, 16, 12, 13 }))
                                        .setWidth(UnitValue.createPercentValue(100))
                                        .setMarginBottom(4);

                        String[] headers = { "DESCRIPTION", "QTY", "UNIT PRICE", "EXCL. VAT", "VAT(15%)", "TOTAL" };
                        for (String h : headers) {
                                itemsTable.addHeaderCell(
                                                new Cell().add(new Paragraph(h).setFont(bold).setFontSize(8)
                                                                .setFontColor(ColorConstants.WHITE))
                                                                .setBackgroundColor(BLACK)
                                                                .setBorder(Border.NO_BORDER)
                                                                .setPadding(6)
                                                                .setTextAlignment(h.equals("DESCRIPTION")
                                                                                ? TextAlignment.LEFT
                                                                                : TextAlignment.RIGHT));
                        }

                        double totalExclVat = 0;
                        double totalVat = 0;
                        double totalIncl = 0;

                        if (order.getItems() != null) {
                                boolean alt = false;
                                for (OrderItem item : order.getItems()) {
                                        double unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : 0;
                                        int qty = item.getQuantity() != null ? item.getQuantity() : 1;

                                        double vatRate = 0.0;
                                        if (item.getProductId() != null) {
                                                vatRate = productRepository.findById(item.getProductId())
                                                                .map(p -> p.getVatRate() != null ? p.getVatRate() : 0.0)
                                                                .orElse(0.0);
                                        }

                                        double exclVat = unitPrice * qty;
                                        double vatOnItem = exclVat * (vatRate / 100.0);
                                        double lineTotal = exclVat + vatOnItem;

                                        totalExclVat += exclVat;
                                        totalVat += vatOnItem;
                                        totalIncl += lineTotal;

                                        com.itextpdf.kernel.colors.Color rowBg = alt ? new DeviceRgb(0xFA, 0xFA, 0xF5)
                                                        : ColorConstants.WHITE;
                                        alt = !alt;

                                        addItemRow(itemsTable, regular, rowBg,
                                                        item.getProductName(),
                                                        String.valueOf(qty),
                                                        String.format("$%.2f", unitPrice),
                                                        String.format("$%.2f", exclVat),
                                                        String.format("$%.2f", vatOnItem),
                                                        String.format("$%.2f", lineTotal));
                                }
                        }

                        document.add(itemsTable);

                        // ══════════════════════════════════════════════════════
                        // TOTALS BLOCK (right-aligned)
                        // ══════════════════════════════════════════════════════
                        Table totalsTable = new Table(UnitValue.createPercentArray(new float[] { 55, 30, 15 }))
                                        .setWidth(UnitValue.createPercentValue(100))
                                        .setMarginBottom(10);

                        totalsTable.addCell(new Cell().setBorder(Border.NO_BORDER)); // spacer

                        // Totals
                        addTotalRow(totalsTable, regular, bold, "Subtotal (excl. VAT):",
                                        String.format("$%.2f", totalExclVat), false);
                        addTotalRow(totalsTable, regular, bold, "VAT Amount:", String.format("$%.2f", totalVat), false);

                        // Grand total with green background
                        Cell labelCell = new Cell().add(new Paragraph("TOTAL DUE (incl. VAT):")
                                        .setFont(bold).setFontSize(11).setFontColor(ColorConstants.WHITE))
                                        .setBackgroundColor(RED_AVO_GREEN).setBorder(Border.NO_BORDER)
                                        .setPadding(8).setTextAlignment(TextAlignment.RIGHT);
                        Cell valueCell = new Cell().add(new Paragraph(String.format("$%.2f", totalIncl))
                                        .setFont(bold).setFontSize(11).setFontColor(ColorConstants.WHITE))
                                        .setBackgroundColor(RED_AVO_GREEN).setBorder(Border.NO_BORDER)
                                        .setPadding(8).setTextAlignment(TextAlignment.RIGHT);

                        totalsTable.addCell(new Cell().setBorder(Border.NO_BORDER));
                        totalsTable.addCell(labelCell);
                        totalsTable.addCell(valueCell);

                        document.add(totalsTable);

                        // ══════════════════════════════════════════════════════
                        // VAT SUMMARY PANEL
                        // ══════════════════════════════════════════════════════
                        Table vatTable = new Table(UnitValue.createPercentArray(new float[] { 20, 20, 20, 20, 20 }))
                                        .setWidth(UnitValue.createPercentValue(100))
                                        .setMarginBottom(14);

                        String[] vatHeaders = { "VAT CODE", "EXCL. VAT", "VAT AMT", "INCL. VAT" };
                        for (String h : vatHeaders) {
                                vatTable.addHeaderCell(new Cell()
                                                .add(new Paragraph(h).setFont(bold).setFontSize(7)
                                                                .setFontColor(ColorConstants.WHITE))
                                                .setBackgroundColor(BLACK).setBorder(Border.NO_BORDER).setPadding(4)
                                                .setTextAlignment(TextAlignment.CENTER));
                        }
                        String[] vatRow = { "STD",
                                        String.format("$%.2f", totalExclVat),
                                        String.format("$%.2f", totalVat),
                                        String.format("$%.2f", totalIncl) };
                        for (String v : vatRow) {
                                vatTable.addCell(new Cell()
                                                .add(new Paragraph(v).setFont(regular).setFontSize(8))
                                                .setBorder(Border.NO_BORDER)
                                                .setBackgroundColor(LIGHT_GREY)
                                                .setPadding(4)
                                                .setTextAlignment(TextAlignment.CENTER));
                        }
                        document.add(vatTable);

                        // ══════════════════════════════════════════════════════
                        // FOOTER
                        // ══════════════════════════════════════════════════════
                        document.add(new LineSeparator(new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(0.8f))
                                        .setStrokeColor(MID_GREY).setMarginBottom(8));

                        String customerFirst = order.getCustomerName() != null
                                        ? order.getCustomerName().split(" ")[0]
                                        : "Valued Customer";

                        document.add(new Paragraph("Hi " + customerFirst + ". Thank you for your purchase")
                                        .setFont(bold).setFontSize(9).setFontColor(RED_AVO_GREEN)
                                        .setTextAlignment(TextAlignment.CENTER).setMarginBottom(4));

                        document.add(new Paragraph("Goods sold are not returnable without a valid receipt. "
                                        + "Exchanges within 7 days with original receipt and tags attached.")
                                        .setFont(regular).setFontSize(7).setFontColor(ColorConstants.GRAY)
                                        .setTextAlignment(TextAlignment.CENTER).setMarginBottom(4));

                        document.add(new Paragraph(
                                        BUSINESS_WEBSITE + "  |  " + BUSINESS_EMAIL + "  |  " + BUSINESS_PHONE)
                                        .setFont(regular).setFontSize(7).setFontColor(ColorConstants.GRAY)
                                        .setTextAlignment(TextAlignment.CENTER));

                        document.close();
                        return baos.toByteArray();

                } catch (Exception e) {
                        System.err.println("[InvoiceService] Failed to generate PDF: " + e.getMessage());
                        e.printStackTrace();
                        return null;
                }
        }

        // ── Helpers ───────────────────────────────────────────────────

        private void addItemRow(Table table, PdfFont font, com.itextpdf.kernel.colors.Color bg, String... cells) {
                boolean first = true;
                for (String val : cells) {
                        Cell c = new Cell()
                                        .add(new Paragraph(val).setFont(font).setFontSize(8.5f))
                                        .setBackgroundColor(bg)
                                        .setBorder(Border.NO_BORDER)
                                        .setBorderBottom(new SolidBorder(MID_GREY, 0.3f))
                                        .setPadding(5)
                                        .setTextAlignment(first ? TextAlignment.LEFT : TextAlignment.RIGHT);
                        table.addCell(c);
                        first = false;
                }
        }

        private void addTotalRow(Table table, PdfFont regular, PdfFont bold,
                        String label, String value, boolean highlight) {
                table.addCell(new Cell().setBorder(Border.NO_BORDER));
                table.addCell(new Cell()
                                .add(new Paragraph(label).setFont(highlight ? bold : regular).setFontSize(9))
                                .setBorder(Border.NO_BORDER).setPadding(4).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(new Cell()
                                .add(new Paragraph(value).setFont(highlight ? bold : regular).setFontSize(9))
                                .setBorder(Border.NO_BORDER).setPadding(4).setTextAlignment(TextAlignment.RIGHT));
        }
}
