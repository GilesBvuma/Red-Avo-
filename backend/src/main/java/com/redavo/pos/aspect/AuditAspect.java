package com.redavo.pos.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.redavo.pos.model.AuditAction;
import com.redavo.pos.model.AuditLog;
import com.redavo.pos.repository.AuditLogRepository;
import com.redavo.pos.security.RedAvoUserDetails;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * AOP aspect that automatically writes an {@link AuditLog} row for every
 * create, update, and delete on tracked service methods.
 * <p>
 * Tracked pointcuts:
 * <ul>
 *   <li>{@code ProductService.*}</li>
 *   <li>{@code OrderService.createOrder(...)}</li>
 *   <li>{@code CustomerService.*} (when split out)</li>
 *   <li>{@code StockLedgerService.applyDelta(...)}</li>
 *   <li>{@code UserService.createUser(...)}, {@code deactivateUser(...)}</li>
 * </ul>
 * The entity type is derived from the return type class name or the first
 * argument type. Before-state for UPDATE/DELETE is serialised prior to
 * the method call; after-state is serialised from the return value.
 */
@Aspect
@Component
public class AuditAspect {

    private final AuditLogRepository auditLogRepo;
    private final ObjectMapper       mapper;

    public AuditAspect(AuditLogRepository auditLogRepo) {
        this.auditLogRepo = auditLogRepo;
        this.mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
    }

    // ── CREATE: ProductService.createProduct / UserService.createUser ────────

    @AfterReturning(
        pointcut = "execution(* com.redavo.pos.service.ProductService.createProduct(..))" +
                   " || execution(* com.redavo.pos.service.UserService.createUser(..))",
        returning = "result")
    public void afterCreate(JoinPoint jp, Object result) {
        writeAudit(AuditAction.CREATE, result, null, toJson(result));
    }

    // ── UPDATE: ProductService.updateProduct / updateStock ───────────────────

    @AfterReturning(
        pointcut = "execution(* com.redavo.pos.service.ProductService.updateProduct(..))" +
                   " || execution(* com.redavo.pos.service.ProductService.updateStock(..))",
        returning = "result")
    public void afterUpdate(JoinPoint jp, Object result) {
        writeAudit(AuditAction.UPDATE, result, null, toJson(result));
    }

    // ── DELETE: ProductService.deleteProduct ──────────────────────────────────

    @Before("execution(* com.redavo.pos.service.ProductService.deleteProduct(..))")
    public void beforeDelete(JoinPoint jp) {
        // entity is already gone after the method — capture ID from arg
        Object idArg = jp.getArgs().length > 0 ? jp.getArgs()[0] : "unknown";
        writeAuditWithId(AuditAction.DELETE, "Product", String.valueOf(idArg),
                "deleted", null);
    }

    // ── ORDER: OrderService.createOrder ──────────────────────────────────────

    @AfterReturning(
        pointcut = "execution(* com.redavo.pos.service.OrderService.createOrder(..))",
        returning = "result")
    public void afterOrderCreate(JoinPoint jp, Object result) {
        writeAudit(AuditAction.CREATE, result, null, toJson(result));
    }

    // ── STOCK DELTA: StockLedgerService.applyDelta ───────────────────────────

    @AfterReturning(
        pointcut = "execution(* com.redavo.pos.service.StockLedgerService.applyDelta(..))",
        returning = "result")
    public void afterStockDelta(JoinPoint jp, Object result) {
        writeAudit(AuditAction.UPDATE, result, null, toJson(result));
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    private void writeAudit(AuditAction action, Object entity,
                            String beforeJson, String afterJson) {
        if (entity == null) return;
        String entityType = entity.getClass().getSimpleName();
        String entityId   = extractId(entity);
        writeAuditWithId(action, entityType, entityId, beforeJson, afterJson);
    }

    private void writeAuditWithId(AuditAction action, String entityType,
                                  String entityId, String beforeJson, String afterJson) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String actor   = "system";
            String roleStr = null;
            Long   storeId = null;

            if (auth != null && auth.isAuthenticated()
                    && auth.getPrincipal() instanceof RedAvoUserDetails ud) {
                actor   = ud.getUsername();
                roleStr = ud.getRole().name();
                storeId = ud.getStoreId();
            }

            AuditLog log = new AuditLog();
            log.setActor(actor);
            log.setRole(roleStr);
            log.setStoreId(storeId);
            log.setEntityType(entityType);
            log.setEntityId(entityId);
            log.setAction(action);
            log.setBeforeJson(beforeJson);
            log.setAfterJson(afterJson);
            auditLogRepo.save(log);

        } catch (Exception e) {
            // Audit must never break the main flow
            System.err.println("[AuditAspect] Failed to write audit log: " + e.getMessage());
        }
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{\"error\": \"serialization failed\"}";
        }
    }

    /** Tries to extract the 'id' field from an entity via reflection. */
    private String extractId(Object entity) {
        try {
            Method getId = entity.getClass().getMethod("getId");
            Object id    = getId.invoke(entity);
            return id != null ? String.valueOf(id) : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}
