package com.campus.modules.resources.dto;

import com.campus.common.enums.ResourceStatus;

public record UpdateResourceRequest(
    String name,
    String location,
    Integer capacity,
    ResourceStatus status,
    String availableDate,
    String startTime,
    String endTime
) {
}