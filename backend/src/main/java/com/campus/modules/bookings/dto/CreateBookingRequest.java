package com.campus.modules.bookings.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record CreateBookingRequest(
    @NotBlank(message = "Resource id is required")
    String resourceId,

    @NotBlank(message = "Booking title is required")
    String title,

    String purpose,

    @NotNull(message = "Date is required")
    LocalDate date,

    @NotNull(message = "Start time is required")
    LocalTime startTime,

    @NotNull(message = "End time is required")
    LocalTime endTime
) {
}