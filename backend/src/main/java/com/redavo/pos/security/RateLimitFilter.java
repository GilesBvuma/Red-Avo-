package com.redavo.pos.security;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import com.google.common.util.concurrent.RateLimiter;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/**
 * IP-based rate limiter applied to sensitive public endpoints.
 *
 * <p>Protected endpoints and their limits:
 * <ul>
 *   <li>/api/auth/login             — 5 requests / minute per IP</li>
 *   <li>/api/auth/forgot-password   — 5 requests / minute per IP</li>
 *   <li>/api/auth/register/admin    — 5 requests / minute per IP</li>
 *   <li>/api/products/{id}/reviews  — 5 requests / minute per IP</li>
 * </ul>
 *
 * <p>Each IP gets its own {@link RateLimiter}. Entries are evicted after
 * 10 minutes of inactivity to prevent unbounded memory growth.
 *
 * <p>Returns HTTP 429 with a JSON body when the limit is exceeded.
 */
@Component
public class RateLimitFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    /** 5 requests per 60 seconds = 1 permit every 12 seconds */
    private static final double PERMITS_PER_SECOND = 5.0 / 60.0;

    /** Review endpoint pattern: /api/products/{numeric-id}/reviews */
    private static final Pattern REVIEW_PATH = Pattern.compile("^/api/products/\\d+/reviews$");

    /**
     * One RateLimiter per IP address, cached for up to 10 minutes of inactivity.
     * Guava's LoadingCache is thread-safe.
     */
    private final LoadingCache<String, RateLimiter> limiters =
            CacheBuilder.newBuilder()
                    .expireAfterAccess(10, TimeUnit.MINUTES)
                    .build(CacheLoader.from(key -> RateLimiter.create(PERMITS_PER_SECOND)));

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  httpReq = (HttpServletRequest)  req;
        HttpServletResponse httpRes = (HttpServletResponse) res;

        String path   = httpReq.getRequestURI();
        String method = httpReq.getMethod();

        boolean isRateLimited = isProtectedEndpoint(path, method);

        if (isRateLimited) {
            String clientIp  = resolveClientIp(httpReq);
            RateLimiter limiter = limiters.getUnchecked(clientIp);

            if (!limiter.tryAcquire()) {
                log.warn("Rate limit exceeded for IP={} path={}", clientIp, path);
                httpRes.setStatus(429);
                httpRes.setContentType("application/json");
                httpRes.getWriter().write(
                        "{\"status\":429," +
                        "\"error\":\"Too Many Requests\"," +
                        "\"message\":\"Too many attempts. Please wait a moment and try again.\"}");
                return;
            }
        }

        chain.doFilter(req, res);
    }

    /**
     * Returns true if this request path+method combination is subject to rate limiting.
     */
    private boolean isProtectedEndpoint(String path, String method) {
        // Auth endpoints (all methods, but in practice these are POST-only)
        if (path.equals("/api/auth/login"))            return true;
        if (path.equals("/api/auth/forgot-password"))  return true;
        if (path.equals("/api/auth/register/admin"))   return true;

        // Public review submission (POST only — GET reads are not rate-limited)
        if ("POST".equalsIgnoreCase(method) && REVIEW_PATH.matcher(path).matches()) return true;

        return false;
    }

    /**
     * Resolves the real client IP from X-Forwarded-For (set by Nginx) or falls
     * back to the direct remote address.
     */
    private String resolveClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // X-Forwarded-For can be a comma-separated list; first entry is the real client
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
