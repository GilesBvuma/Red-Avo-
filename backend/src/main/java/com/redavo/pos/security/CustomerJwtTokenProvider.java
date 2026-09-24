package com.redavo.pos.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

/**
 * Issues and validates short-lived JWTs specifically for storefront customers
 * (separate from the POS staff JWT produced by {@link JwtTokenProvider}).
 *
 * <p>Claims embedded in the token:
 * <ul>
 *   <li>{@code sub}        — customer email</li>
 *   <li>{@code customerId} — database PK from the customers table</li>
 *   <li>{@code type}       — literal "CUSTOMER" to distinguish from staff tokens</li>
 * </ul>
 *
 * <p>Default expiry: 30 days (configurable via {@code app.customer.jwt.expiration-ms}).
 */
@Component
public class CustomerJwtTokenProvider {

    private final SecretKey signingKey;
    private final long expirationMs;

    public CustomerJwtTokenProvider(
            @Value("${app.customer.jwt.secret:${app.jwt.secret}}") String secret,
            @Value("${app.customer.jwt.expiration-ms:2592000000}") long expirationMs) {
        // 30 days default: 30 * 24 * 60 * 60 * 1000 = 2_592_000_000
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            keyBytes = padded;
        }
        this.signingKey   = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(Long customerId, String email) {
        return Jwts.builder()
                .subject(email)
                .claim("customerId", customerId)
                .claim("type", "CUSTOMER")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            // Reject staff tokens accidentally sent to customer endpoints
            return "CUSTOMER".equals(claims.get("type", String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public Long getCustomerIdFromToken(String token) {
        return parseClaims(token).get("customerId", Long.class);
    }
}
