package com.campus.modules.bookings.dto;

import java.time.LocalDate;
import java.util.List;

public record BookingAvailabilityDayResponse(
    LocalDate date,
    int totalSlots,
    int availableSlotCount,
    List<TimeSlotResponse> availableSlots
) {
}
