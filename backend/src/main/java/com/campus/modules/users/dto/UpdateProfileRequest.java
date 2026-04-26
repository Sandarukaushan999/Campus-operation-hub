package com.campus.modules.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// DTO for PUT /api/users/me - only safe fields; role is intentionally excluded.
public record UpdateProfileRequest(

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    String fullName,

    @Pattern(
        regexp = "^$|^[+]?[0-9\\s\\-().]{7,20}$",
        message = "Phone number is invalid"
    )
    String phone
) {
}
