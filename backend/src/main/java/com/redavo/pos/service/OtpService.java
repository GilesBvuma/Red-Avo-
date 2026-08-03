package com.redavo.pos.service;

import com.redavo.pos.model.PasswordResetToken;
import com.redavo.pos.repository.PasswordResetTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    private final PasswordResetTokenRepository tokenRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    public OtpService(PasswordResetTokenRepository tokenRepository,
                      NotificationService notificationService,
                      PasswordEncoder passwordEncoder) {
        this.tokenRepository = tokenRepository;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void generateAndSendOtp(String email) {
        // Generate a 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        // Hash it for secure storage
        String otpHash = passwordEncoder.encode(otp);

        // Remove any existing tokens for this email
        tokenRepository.deleteByEmail(email);

        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(email);
        token.setOtpHash(otpHash);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        
        tokenRepository.save(token);

        // Send it via email
        notificationService.sendOtpEmail(email, otp);
    }

    @Transactional
    public boolean validateOtp(String email, String otp) {
        // Find by email — at most one token exists per email since we delete before generating.
        return tokenRepository.findByEmail(email)
                .filter(t -> !t.getExpiresAt().isBefore(java.time.LocalDateTime.now()))
                .filter(t -> passwordEncoder.matches(otp, t.getOtpHash()))
                .map(t -> {
                    tokenRepository.delete(t);
                    return true;
                })
                .orElse(false);
    }
}
