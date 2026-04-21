package com.campus.modules.auth.service;

import com.campus.common.enums.UserRole;
import com.campus.common.exception.BadRequestException;
import com.campus.common.exception.ConflictException;
import com.campus.domain.User;
import com.campus.modules.auth.dto.AuthResponse;
import com.campus.modules.auth.dto.LoginRequest;
import com.campus.modules.auth.dto.RegisterRequest;
import com.campus.repository.UserRepository;
import com.campus.security.JwtService;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email is already registered");
        }

        Instant now = Instant.now();
        User user = User.builder()
            .fullName(request.fullName().trim())
            .email(normalizedEmail)
            .password(passwordEncoder.encode(request.password()))
            .role(UserRole.USER)
            .enabled(true)
            .createdAt(now)
            .updatedAt(now)
            .build();

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);
        return toAuthResponse(saved, token);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);
        return toAuthResponse(user, token);
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return new AuthResponse(
            token,
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole()
        );
    }
}