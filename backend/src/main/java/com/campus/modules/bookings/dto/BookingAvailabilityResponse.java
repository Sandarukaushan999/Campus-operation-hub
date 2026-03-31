package com.campus.modules.bookings.dto;

import java.time.LocalDate;
import java.util.List;

public record BookingAvailabilityResponse(
    String resourceId,
    LocalDate from,
    LocalDate to,
    List<BookingAvailabilityDayResponse> days
) {
}
