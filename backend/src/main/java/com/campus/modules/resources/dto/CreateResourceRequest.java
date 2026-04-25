package com.campus.modules.resources.dto;

import com.campus.common.enums.ResourceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateResourceRequest(
    @NotBlank(message = "Resource name is required")
    String name,

    @NotBlank(message = "Location is required")
    String location,

    @NotNull(message = "Capacity is required")
    @Positive(message = "Capacity must be greater than 0")
    Integer capacity,

    ResourceStatus status
) {
}