package com.redavo.pos.security;

import com.redavo.pos.model.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

/**
 * Creates and validates JWT tokens using JJWT 0.12.x.
 * <p>
 * Claims embedded in the token:
 * <ul>
 *   <li>{@code sub}      — username</li>
 *   <li>{@code userId}   — database PK</li>
 *   <li>{@code role}     — ADMIN | EMPLOYEE</li>
 *   <li>{@code storeId}  — Long (null for ADMIN)</li>
 * </ul>
 */
@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        // Decode base64 secret → raw bytes → HMAC-SHA256 key
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        // Pad if key bytes < 32 (256-bit minimum for HS256)
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            keyBytes = padded;
        }
        this.signingKey  = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(Long userId, String email, Role role, Long storeId) {
        return Jwts.builder()
                .subject(email)
                .claim("userId",  userId)
                .claim("role",    role.name())
                .claim("storeId", storeId)
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
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public Role getRoleFromToken(String token) {
        String roleStr = parseClaims(token).get("role", String.class);
        return Role.valueOf(roleStr);
    }

    public Long getUserIdFromToken(String token) {
        return parseClaims(token).get("userId", Long.class);
    }

    public Long getStoreIdFromToken(String token) {
        return parseClaims(token).get("storeId", Long.class);
    }
}
