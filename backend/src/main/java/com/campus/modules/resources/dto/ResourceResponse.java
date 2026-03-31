package com.campus.modules.resources.dto;

import com.campus.common.enums.ResourceStatus;
import java.time.Instant;

public record ResourceResponse(
    String id,
    String name,
    String location,
    Integer capacity,
    ResourceStatus status,
    Instant createdAt,
    Instant updatedAt
) {
}