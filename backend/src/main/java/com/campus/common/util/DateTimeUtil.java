package com.campus.common.util;

import java.time.LocalTime;

public final class DateTimeUtil {

    private DateTimeUtil() {
    }

    public static boolean hasOverlap(LocalTime newStart, LocalTime newEnd, LocalTime existingStart, LocalTime existingEnd) {
        return newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart);
    }
}