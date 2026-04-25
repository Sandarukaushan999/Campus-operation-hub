package com.campus.modules.bookings.dto;

import com.campus.common.enums.BookingStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public record BookingResponse(
    String id,
    String resourceId,
    String userId,
    String title,
    String purpose,
    LocalDate date,
    LocalTime startTime,
    LocalTime endTime,
    BookingStatus status,
    String rejectionReason,
    String approverId,
    Instant createdAt,
    Instant updatedAt
) {
}