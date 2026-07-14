package com.redavo.pos.controller;

import com.redavo.pos.dto.auth.*;
import com.redavo.pos.model.Role;
import com.redavo.pos.model.User;
import com.redavo.pos.security.JwtTokenProvider;
import com.redavo.pos.security.RedAvoUserDetails;
import com.redavo.pos.service.OtpService;
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

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"},
             allowCredentials = "true")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;
    private final OtpService otpService;
    private final String superPassword = "12345678"; // Hardcoded per user request, can be moved to properties later.

    public AuthController(AuthenticationManager authManager,
                          JwtTokenProvider tokenProvider,
                          UserService userService,
                          OtpService otpService) {
        this.authManager = authManager;
        this.tokenProvider = tokenProvider;
        this.userService = userService;
        this.otpService = otpService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        try {
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

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
                    "email",      userDetails.getUsername(),
                    "name",       userDetails.getFullName() != null ? userDetails.getFullName() : userDetails.getUsername(),
                    "expiresIn",  86400
            ));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        }
    }

    @PostMapping("/register/admin")
    public ResponseEntity<?> registerAdmin(@RequestBody AdminRegisterRequestDTO request) {
        if (!superPassword.equals(request.getSuperPassword())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Invalid super password"));
        }
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match"));
        }

        try {
            User created = userService.createUser(
                    request.getFullName(),
                    request.getPhoneNumber(),
                    request.getEmail(),
                    request.getPassword(),
                    Role.ADMIN,
                    null);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "id", created.getId(),
                    "email", created.getEmail(),
                    "role", created.getRole().name()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register/employee")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> registerEmployee(@RequestBody EmployeeRegisterRequestDTO request) {
        if (request.getStoreId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Store ID is required for employee"));
        }
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match"));
        }

        try {
            User created = userService.createUser(
                    request.getFullName(),
                    request.getPhoneNumber(),
                    request.getEmail(),
                    request.getPassword(),
                    Role.EMPLOYEE,
                    request.getStoreId());

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "id", created.getId(),
                    "email", created.getEmail(),
                    "role", created.getRole().name(),
                    "storeId", created.getStoreId()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequestDTO request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        try {
            otpService.generateAndSendOtp(request.getEmail());
            // Always return OK even if email doesn't exist to prevent email enumeration
            return ResponseEntity.ok(Map.of("message", "If the email is registered, an OTP has been sent."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error sending OTP"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequestDTO request) {
        if (request.getEmail() == null || request.getOtp() == null || request.getNewPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email, OTP, and new password are required"));
        }

        boolean isValid = otpService.validateOtp(request.getEmail(), request.getOtp());
        if (!isValid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired OTP"));
        }

        userService.updatePassword(request.getEmail(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}
