package com.redavo.pos.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Improvement D — Global error handler.
 * <p>
 * Catches all unhandled exceptions and returns a structured JSON body:
 * {@code { "status", "error", "message", "timestamp" }}
 * instead of leaking Spring stack traces to the browser.
 * <p>
 * Registered automatically by Spring Boot via {@link RestControllerAdvice}.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final Environment env;

    public GlobalExceptionHandler(Environment env) {
        this.env = env;
    }

    // ── 400 Bad Request ─────────────────────────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /** Bean Validation failure — returns field-level messages. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return error(HttpStatus.BAD_REQUEST, fieldErrors);
    }

    // ── 409 Conflict ────────────────────────────────────────────────────────

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        // Inspect the root SQL exception for a precise SQLState code first.
        // This is more reliable than parsing the message string.
        String sqlState = null;
        Throwable cause = ex.getCause();
        while (cause != null) {
            if (cause instanceof java.sql.SQLException sqle) {
                sqlState = sqle.getSQLState();
                break;
            }
            cause = cause.getCause();
        }

        if ("22001".equals(sqlState)) {
            // string_data_right_truncation — a column value exceeded its declared length
            return error(HttpStatus.BAD_REQUEST, "One of the fields is too long. Please shorten it.");
        }
        if ("23505".equals(sqlState)) {
            // unique_violation — duplicate key (SKU, invoice number, etc.)
            return error(HttpStatus.CONFLICT, "This SKU or product already exists.");
        }

        // Fallback: message-string heuristic for environments where SQLState is not surfaced
        String msg = ex.getMessage();
        if (msg != null && msg.toLowerCase().contains("duplicate key")) {
            return error(HttpStatus.CONFLICT, "This SKU or product already exists.");
        }
        return error(HttpStatus.CONFLICT, "A database integrity constraint was violated.");
    }

    // ── 404 Not Found ───────────────────────────────────────────────────────

    @ExceptionHandler({NoSuchElementException.class, jakarta.persistence.EntityNotFoundException.class})
    public ResponseEntity<Map<String, Object>> handleNotFound(RuntimeException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // ── 403 Forbidden ───────────────────────────────────────────────────────

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, "You do not have permission to perform this action");
    }

    // ── 500 Internal Server Error ────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAll(Exception ex) {
        // Generate a short reference code so users can report it and devs can grep it
        String refCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Always log full detail server-side — grep: REF:<code>
        log.error("[REF:{}] Unhandled exception [{}]: {}", refCode, ex.getClass().getSimpleName(), ex.getMessage(), ex);

        // Only expose internals in local / dev profile — never in staging or production
        boolean isDev = Arrays.stream(env.getActiveProfiles())
                .anyMatch(p -> p.equals("local") || p.equals("dev"));

        String message = isDev
                ? "Dev — " + ex.getClass().getSimpleName() + ": " + ex.getMessage()
                : "Something went wrong on our side. Reference: " + refCode;

        return errorWithRef(HttpStatus.INTERNAL_SERVER_ERROR, message, refCode);
    }

    // ── Builders ─────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status",    status.value());
        body.put("error",     status.getReasonPhrase());
        body.put("message",   message);
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(status).body(body);
    }

    private ResponseEntity<Map<String, Object>> errorWithRef(HttpStatus status, String message, String refCode) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status",        status.value());
        body.put("error",         status.getReasonPhrase());
        body.put("message",       message);
        body.put("referenceCode", refCode);
        body.put("timestamp",     LocalDateTime.now().toString());
        return ResponseEntity.status(status).body(body);
    }
}
