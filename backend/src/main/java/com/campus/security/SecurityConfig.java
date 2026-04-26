package com.campus.security;

import com.campus.common.response.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CorsConfigurationSource corsConfigurationSource;
    private final ObjectMapper objectMapper;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource))

            // Stateless - no HTTP sessions. OAuth2 needs a brief session during the
            // redirect dance so we allow IF_REQUIRED only for that flow; the JwtFilter
            // handles all API calls without touching the session.
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )

            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    ErrorResponse body = new ErrorResponse(
                        HttpStatus.UNAUTHORIZED.value(),
                        HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                        "Authentication required",
                        request.getRequestURI(),
                        List.of("Please log in again"),
                        Instant.now()
                    );
                    response.getWriter().write(objectMapper.writeValueAsString(body));
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    ErrorResponse body = new ErrorResponse(
                        HttpStatus.FORBIDDEN.value(),
                        HttpStatus.FORBIDDEN.getReasonPhrase(),
                        "Access denied",
                        request.getRequestURI(),
                        List.of("You do not have permission to access this resource"),
                        Instant.now()
                    );
                    response.getWriter().write(objectMapper.writeValueAsString(body));
                })
            )

            .authorizeHttpRequests(auth -> auth
                // Public auth endpoints (register, login)
                .requestMatchers("/api/auth/**", "/login").permitAll()
                // OAuth2 redirect URIs must be public
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                // Public resource reads
                .requestMatchers(HttpMethod.GET, "/api/resources/**").permitAll()
                // Docker healthcheck & static resources
                .requestMatchers("/actuator/health", "/actuator/health/**", "/favicon.ico", "/error").permitAll()
                .anyRequest().authenticated()
            )

            // ── OAuth2 login (Google) ──────────────────────────────────────────
            // Spring handles /oauth2/authorization/google and the callback automatically.
            // After success, our handler generates a JWT and redirects to the frontend.
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2SuccessHandler)
                .failureHandler((request, response, exception) -> {
                    System.err.println("=== OAUTH2 LOGIN FAILED ===");
                    exception.printStackTrace();
                    response.sendRedirect("http://localhost:5174/login?error=oauth_failed");
                })
            )

            // ── JWT filter (existing email/password flow) ──────────────────────
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
