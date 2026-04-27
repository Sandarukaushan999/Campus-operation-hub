package com.campus.modules.users.dto;

import com.campus.common.enums.UserRole;
import java.time.Instant;

public record UserResponse(
    String id,
    String fullName,
    String phone,
    String email,
    UserRole role,
    boolean enabled,
    java.util.Map<String, Boolean> notificationPreferences,
    Instant createdAt,
    Instant updatedAt
) {
}

