package com.campus.modules.bookings.dto;

import java.time.LocalTime;

public record TimeSlotResponse(
    LocalTime startTime,
    LocalTime endTime
) {
}
