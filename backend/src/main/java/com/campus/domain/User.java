package com.campus.domain;

import com.campus.common.enums.UserRole;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User implements UserDetails {

    @Id
    private String id;

    private String fullName;

    private String phone;

    // OAuth2 provider info ("local" for email/password users, "google" for OAuth users)
    @Builder.Default
    private String provider = "local";

    private String googleId;

    @Indexed(unique = true)
    private String email;

    @JsonIgnore
    private String password;

    @Builder.Default
    private UserRole role = UserRole.USER;

    @Builder.Default
    private boolean enabled = true;

    @Builder.Default
    private java.util.Map<String, Boolean> notificationPreferences = new java.util.HashMap<>();

    private Instant createdAt;

    private Instant updatedAt;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}