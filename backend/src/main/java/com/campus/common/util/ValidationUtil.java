package com.campus.common.util;

import com.campus.common.exception.BadRequestException;
import java.time.LocalDate;
import java.time.LocalTime;

public final class ValidationUtil {

    private ValidationUtil() {
    }

    public static void validateCapacity(Integer capacity) {
        if (capacity == null || capacity <= 0) {
            throw new BadRequestException("Capacity must be greater than 0");
        }
    }

    public static void validateBookingDate(LocalDate date) {
        if (date == null) {
            throw new BadRequestException("Booking date is required");
        }
        if (date.isBefore(LocalDate.now())) {
            throw new BadRequestException("Booking date cannot be in the past");
        }
    }

    public static void validateBookingTime(LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null) {
            throw new BadRequestException("Start time and end time are required");
        }
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Start time must be before end time");
        }
    }
}