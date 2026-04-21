package com.campus.security;

import com.campus.domain.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final int MIN_SECRET_LENGTH = 32;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.security.jwt-secret}")
    private String secret;

    @Value("${app.security.jwt-expiration-seconds:86400}")
    private long expirationSeconds;

    @PostConstruct
    void validateSecret() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                "app.security.jwt-secret is not set. Define APP_SECURITY_JWT_SECRET in your environment."
            );
        }
        if (secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                "app.security.jwt-secret must be at least " + MIN_SECRET_LENGTH + " characters."
            );
        }
    }

    public String generateToken(User user) {
        try {
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            Map<String, Object> payload = new HashMap<>();
            payload.put("sub", user.getId());
            payload.put("email", user.getEmail());
            payload.put("role", user.getRole().name());
            payload.put("exp", Instant.now().getEpochSecond() + expirationSeconds);

            String encodedHeader = encodeJson(header);
            String encodedPayload = encodeJson(payload);
            String unsigned = encodedHeader + "." + encodedPayload;
            String signature = sign(unsigned);

            return unsigned + "." + signature;
        } catch (Exception ex) {
            throw new IllegalStateException("Could not generate token", ex);
        }
    }

    public String extractUserId(String token) {
        Object sub = extractPayload(token).get("sub");
        return sub == null ? null : sub.toString();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        if (!(userDetails instanceof User user)) {
            return false;
        }

        Map<String, Object> payload = extractPayload(token);
        String subject = String.valueOf(payload.get("sub"));
        long exp = Long.parseLong(String.valueOf(payload.get("exp")));

        return verifySignature(token)
            && subject.equals(user.getId())
            && Instant.now().getEpochSecond() < exp;
    }

    private Map<String, Object> extractPayload(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid token");
            }

            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            return objectMapper.readValue(decoded, new TypeReference<>() {
            });
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid token", ex);
        }
    }

    private boolean verifySignature(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }
            String unsigned = parts[0] + "." + parts[1];
            String expected = sign(unsigned);
            return expected.equals(parts[2]);
        } catch (Exception ex) {
            return false;
        }
    }

    private String encodeJson(Map<String, Object> data) throws Exception {
        byte[] json = objectMapper.writeValueAsBytes(data);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(json);
    }

    private String sign(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(key);
        byte[] signature = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
    }
}