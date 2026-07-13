package com.redavo.pos.security;

import com.redavo.pos.model.Role;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Spring Security {@link UserDetails} implementation that carries the extra
 * Red Avo context (userId, role, storeId) so it is accessible via
 * {@code SecurityContextHolder} in controllers and aspects.
 */
@Getter
public class RedAvoUserDetails implements UserDetails {

    private final Long userId;
    private final String username;
    private final String password;
    private final Role role;
    /** Null for ADMIN users (cross-store access). */
    private final Long storeId;
    private final boolean active;

    public RedAvoUserDetails(Long userId, String username, String password,
                             Role role, Long storeId, boolean active) {
        this.userId   = userId;
        this.username = username;
        this.password = password;
        this.role     = role;
        this.storeId  = storeId;
        this.active   = active;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isAccountNonLocked()     { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()              { return active; }

    /** Convenience helper used in @PreAuthorize SPeL expressions. */
    public boolean isAdmin() {
        return role == Role.ADMIN;
    }

    /** True if this employee is assigned to the given store, or if the user is ADMIN. */
    public boolean canAccessStore(Long targetStoreId) {
        return isAdmin() || (storeId != null && storeId.equals(targetStoreId));
    }
}
