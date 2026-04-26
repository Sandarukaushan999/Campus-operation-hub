package com.campus.security;

import com.campus.common.enums.UserRole;
import com.campus.domain.User;
import com.campus.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

// Handles the callback from Google after a successful OAuth2 login.
//
// Flow:
//   1. Google returns the authenticated OAuth2User to Spring Security.
//   2. We extract the email and profile name from the Google attributes.
//   3. We check if the user already exists in MongoDB.
//      - If yes  → use the existing record (even if they registered locally).
//      - If no   → create a new USER-role account with provider="google".
//   4. We generate a JWT using the existing JwtService.
//   5. We redirect the browser to the frontend callback URL with the token
//      as a query parameter so the React app can store it.
//
// This keeps JWT as the single auth mechanism - no session is created.
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    // Frontend URL that receives the JWT token after OAuth login.
    // Default: http://localhost:5174/oauth2/callback
    @Value("${app.oauth2.redirect-uri:http://localhost:5174/oauth2/callback}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email    = oAuth2User.getAttribute("email");
        String name     = oAuth2User.getAttribute("name");
        String googleId = oAuth2User.getAttribute("sub");  // Google's unique user ID

        if (email == null) {
            log.warn("OAuth2 login failed: Google did not return an email address.");
            response.sendRedirect(redirectUri + "?error=no_email");
            return;
        }

        String normalizedEmail = email.trim().toLowerCase();

        // Find or create the user account
        User user = userRepository.findByEmail(normalizedEmail)
            .orElseGet(() -> createOAuthUser(normalizedEmail, name, googleId));

        // Update googleId if missing (e.g. user registered locally first, now uses Google)
        if (user.getGoogleId() == null && googleId != null) {
            user.setGoogleId(googleId);
            user.setProvider("google");
            user.setUpdatedAt(Instant.now());
            user = userRepository.save(user);
        }

        // Generate a JWT exactly the same way as the regular login endpoint
        String token = jwtService.generateToken(user);

        log.info("OAuth2 login successful for: {}", normalizedEmail);

        // Redirect to the React callback page with the token in the URL
        getRedirectStrategy().sendRedirect(request, response, redirectUri + "?token=" + token);
    }

    private User createOAuthUser(String email, String name, String googleId) {
        Instant now = Instant.now();
        User newUser = User.builder()
            .fullName(name != null ? name.trim() : email)
            .email(email)
            .password(null)             // OAuth users have no local password
            .role(UserRole.USER)
            .provider("google")
            .googleId(googleId)
            .enabled(true)
            .createdAt(now)
            .updatedAt(now)
            .build();

        User saved = userRepository.save(newUser);
        log.info("Created new OAuth2 user: {} (google)", email);
        return saved;
    }
}
