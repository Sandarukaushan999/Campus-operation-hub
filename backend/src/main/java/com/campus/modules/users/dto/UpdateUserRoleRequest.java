package com.campus.modules.users.dto;

import com.campus.common.enums.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
    @NotNull(message = "Role is required")
    UserRole role
) {
}

