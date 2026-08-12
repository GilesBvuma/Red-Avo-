package com.redavo.pos.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Value;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration.
 * <p>
 * <strong>Phase 1 note:</strong> Existing API routes are left open (permitAll)
 * so the POS frontend continues to work while the login UI is built in Phase 2.
 * New routes (auth register, audit, stock ledger writes) are locked down now.
 * Method-level {@code @PreAuthorize} annotations are in place — they fire when
 * a valid JWT is present, and are effectively bypassed for anonymous requests
 * (since we permit all at the HTTP level during Phase 1).
 * <p>
 * In Phase 2, flip the catch-all from {@code permitAll()} to
 * {@code authenticated()} once the POS login page is live.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOriginsRaw;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ── Public endpoints ─────────────────────────────────────────────────────────
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/login", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/register/admin", "/api/contact", "/api/customers/auth/otp/send", "/api/customers/auth/otp/verify").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/products/*/reviews").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/categories/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/stock/products/*/variants").permitAll() // storefront variant reads
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/community").permitAll() // storefront community grid
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/orders").permitAll() // Storefront checkout
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/orders/*/confirm").permitAll() // PayNow webhook
                .requestMatchers("/uploads/**").permitAll() // Public images
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll() // Swagger UI
                .requestMatchers("/error").permitAll() // Allow Spring Boot error endpoint
                .requestMatchers("/api/gift-cards/purchase", "/api/gift-cards/redeem").permitAll() // Gift card storefront
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/gift-cards/validate/**").permitAll() // Gift card balance check
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/gift-cards/tiers").permitAll() // Gift card tiers
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/colors").permitAll() // Public color palette for storefront

                // ── Admin-only endpoints — enforced at HTTP level ───────────────────────────────
                .requestMatchers("/api/auth/register/employee").hasRole("ADMIN")
                .requestMatchers("/api/audit/**").hasRole("ADMIN")
                // Employees need to READ stores (for stock/transfers pages); writes stay admin-only
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/stores/**").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/stores/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/stores/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/stores/**").hasRole("ADMIN")
                .requestMatchers("/api/employees/**").authenticated()
                .requestMatchers("/api/admin/reviews/**").authenticated()

                // ── Phase 2: All remaining endpoints require authentication ───────────────────────
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOriginsRaw.split(","));
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
