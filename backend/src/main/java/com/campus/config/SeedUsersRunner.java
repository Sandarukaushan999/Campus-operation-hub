package com.campus.config;

import com.campus.common.enums.UserRole;
import com.campus.domain.User;
import com.campus.repository.UserRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// Seeds a few temporary accounts for local dev / demos.
//
// Enabled only when app.seed.enabled=true.
// Configure users via env vars (recommended) or application properties:
//   APP_SEED_ENABLED=true
//   APP_SEED_ADMIN_EMAIL=...
//   APP_SEED_ADMIN_PASSWORD=...
//   APP_SEED_ADMIN_FULL_NAME=...
//   (same for TECH and USER)
//
// We never overwrite existing users; we only create missing emails.
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class SeedUsersRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin.email:}")
    private String adminEmail;

    @Value("${app.seed.admin.password:}")
    private String adminPassword;

    @Value("${app.seed.admin.full-name:Admin User}")
    private String adminFullName;

    @Value("${app.seed.technician.email:}")
    private String technicianEmail;

    @Value("${app.seed.technician.password:}")
    private String technicianPassword;

    @Value("${app.seed.technician.full-name:Technician User}")
    private String technicianFullName;

    @Value("${app.seed.user.email:}")
    private String userEmail;

    @Value("${app.seed.user.password:}")
    private String userPassword;

    @Value("${app.seed.user.full-name:Student User}")
    private String userFullName;

    @Override
    public void run(ApplicationArguments args) {
        seedOne("admin", adminEmail, adminPassword, adminFullName, UserRole.ADMIN);
        seedOne("technician", technicianEmail, technicianPassword, technicianFullName, UserRole.TECHNICIAN);
        seedOne("user", userEmail, userPassword, userFullName, UserRole.USER);
    }

    private void seedOne(String label, String emailRaw, String passwordRaw, String fullNameRaw, UserRole role) {
        String email = emailRaw == null ? "" : emailRaw.trim().toLowerCase();
        String password = passwordRaw == null ? "" : passwordRaw;
        String fullName = fullNameRaw == null ? "" : fullNameRaw.trim();

        if (email.isBlank() || password.isBlank()) {
            log.info("Seed user '{}' skipped (missing email/password).", label);
            return;
        }

        if (userRepository.existsByEmail(email)) {
            log.info("Seed user '{}' skipped (already exists): {}", label, email);
            return;
        }

        Instant now = Instant.now();
        User user = User.builder()
            .fullName(fullName.isBlank() ? label : fullName)
            .email(email)
            .password(passwordEncoder.encode(password))
            .role(role)
            .enabled(true)
            .createdAt(now)
            .updatedAt(now)
            .build();

        userRepository.save(user);
        log.info("Seed user created: {} ({})", email, role);
    }
}

