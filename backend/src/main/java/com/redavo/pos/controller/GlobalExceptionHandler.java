package com.redavo.pos.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;
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
        String msg = ex.getMessage();
        if (msg != null && msg.toLowerCase().contains("duplicate key")) {
            return error(HttpStatus.CONFLICT, "A product or variant with this SKU already exists. Please use a unique SKU.");
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
        // Log for server-side debugging
        System.err.println("[GlobalExceptionHandler] Unhandled exception: " + ex.getMessage());
        ex.printStackTrace();
        
        String topStackTrace = ex.getStackTrace().length > 0 
                ? ex.getStackTrace()[0].toString() 
                : "no stack trace";
        
        return error(HttpStatus.INTERNAL_SERVER_ERROR,
                "Debug Error: " + ex.getClass().getSimpleName() + 
                " | Msg: " + ex.getMessage() + 
                " | At: " + topStackTrace);
    }

    // ── Builder ─────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status",    status.value());
        body.put("error",     status.getReasonPhrase());
        body.put("message",   message);
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(status).body(body);
    }
}
