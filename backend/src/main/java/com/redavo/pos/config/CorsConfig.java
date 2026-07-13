package com.redavo.pos.config;

/**
 * CORS is now configured centrally in
 * {@link com.redavo.pos.security.SecurityConfig#corsConfigurationSource()}.
 * <p>
 * This file is intentionally left empty — the WebMvcConfigurer-based CORS bean
 * that was here previously was removed to avoid duplicate CORS headers once
 * Spring Security's filter chain took ownership of the CORS configuration.
 *
 * @see com.redavo.pos.security.SecurityConfig
 */
public class CorsConfig {
    // Intentionally empty — see SecurityConfig
}
