package com.campus.modules.auth.dto;

import com.campus.common.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Full name is required")
    String fullName,

    @Email(message = "A valid email is required")
    @NotBlank(message = "Email is required")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must have at least 8 characters")
    String password,

    UserRole role
) {
}
