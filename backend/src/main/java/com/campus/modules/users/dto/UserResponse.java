package com.campus.modules.users.dto;

import com.campus.common.enums.UserRole;
import java.time.Instant;

public record UserResponse(
    String id,
    String fullName,
    String email,
    UserRole role,
    boolean enabled,
    Instant createdAt,
    Instant updatedAt
) {
}

