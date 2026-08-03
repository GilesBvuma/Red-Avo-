package com.redavo.pos.model;

/**
 * System-wide roles.
 * <ul>
 *   <li>ADMIN  — full cross-store access; can manage users, stores, promotions, financials.</li>
 *   <li>EMPLOYEE — scoped to their assigned store only; cannot manage users or view financials.</li>
 * </ul>
 */
public enum Role {
    ADMIN,
    EMPLOYEE
}
