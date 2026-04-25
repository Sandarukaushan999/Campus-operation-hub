package com.campus.modules.bookings.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectBookingRequest(
    @NotBlank(message = "Rejection reason is required")
    String reason
) {
}