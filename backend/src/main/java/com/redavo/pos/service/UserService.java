package com.redavo.pos.service;

import com.redavo.pos.model.Role;
import com.redavo.pos.model.User;
import com.redavo.pos.repository.UserRepository;
import com.redavo.pos.security.RedAvoUserDetails;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Manages user accounts and implements {@link UserDetailsService} for
 * Spring Security's authentication pipeline.
 */
@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ── Spring Security integration ───────────────────────────────────────────

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found: " + username));

        return new RedAvoUserDetails(
                user.getId(),
                user.getUsername(),
                user.getPasswordHash(),
                user.getRole(),
                user.getStoreId(),
                Boolean.TRUE.equals(user.getActive()));
    }

    // ── User management (ADMIN only — enforced by controller @PreAuthorize) ──

    @Transactional
    public User createUser(String username, String email,
                           String rawPassword, Role role, Long storeId) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already taken: " + username);
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered: " + email);
        }
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setStoreId(role == Role.ADMIN ? null : storeId);
        user.setActive(true);
        return userRepository.save(user);
    }

    @Transactional
    public User deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setActive(false);
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Used by DataSeeder to create the initial admin account without
     * going through the full registration flow.
     */
    @Transactional
    public void ensureAdminExists(String username, String email, String rawPassword) {
        if (!userRepository.existsByUsername(username)) {
            createUser(username, email, rawPassword, Role.ADMIN, null);
            System.out.println("[UserService] Default admin user created: " + username);
        }
    }
}
