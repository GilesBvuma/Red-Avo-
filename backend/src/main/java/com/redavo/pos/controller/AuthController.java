package com.redavo.pos.controller;

import com.redavo.pos.model.Role;
import com.redavo.pos.model.User;
import com.redavo.pos.security.JwtTokenProvider;
import com.redavo.pos.security.RedAvoUserDetails;
import com.redavo.pos.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Authentication endpoints.
 *
 * <ul>
 *   <li>{@code POST /api/auth/login}    — public; returns a JWT</li>
 *   <li>{@code POST /api/auth/register} — ADMIN only; creates employee accounts</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"},
             allowCredentials = "true")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtTokenProvider      tokenProvider;
    private final UserService           userService;

    public AuthController(AuthenticationManager authManager,
                          JwtTokenProvider tokenProvider,
                          UserService userService) {
        this.authManager   = authManager;
        this.tokenProvider = tokenProvider;
        this.userService   = userService;
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "username and password are required"));
        }

        try {
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));

            RedAvoUserDetails userDetails = (RedAvoUserDetails) auth.getPrincipal();

            String token = tokenProvider.generateToken(
                    userDetails.getUserId(),
                    userDetails.getUsername(),
                    userDetails.getRole(),
                    userDetails.getStoreId());

            return ResponseEntity.ok(Map.of(
                    "token",      token,
                    "role",       userDetails.getRole().name(),
                    "storeId",    userDetails.getStoreId() != null ? userDetails.getStoreId() : "null",
                    "username",   userDetails.getUsername(),
                    "expiresIn",  86400
            ));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }
    }

    // ── POST /api/auth/register — ADMIN only ─────────────────────────────────

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body) {
        try {
            String username = (String) body.get("username");
            String email    = (String) body.get("email");
            String password = (String) body.get("password");
            String roleStr  = (String) body.getOrDefault("role", "EMPLOYEE");
            Long   storeId  = body.get("storeId") != null
                    ? Long.valueOf(body.get("storeId").toString()) : null;

            Role role = Role.valueOf(roleStr.toUpperCase());

            if (role == Role.EMPLOYEE && storeId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "storeId is required for EMPLOYEE accounts"));
            }

            User created = userService.createUser(username, email, password, role, storeId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "id",       created.getId(),
                            "username", created.getUsername(),
                            "email",    created.getEmail(),
                            "role",     created.getRole().name(),
                            "storeId",  created.getStoreId()
                    ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
