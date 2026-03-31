package com.campus.modules.auth.dto;

import com.campus.common.enums.UserRole;

public record AuthResponse(
    String token,
    String userId,
    String fullName,
    String email,
    UserRole role
) {
}