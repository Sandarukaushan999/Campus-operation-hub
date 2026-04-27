package com.campus.modules.analytics.service;

import com.campus.domain.Booking;
import com.campus.domain.Resource;
import com.campus.repository.BookingRepository;
import com.campus.repository.ResourceRepository;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    @Override
    public Map<String, Object> getUsageAnalytics() {
        List<Booking> bookings = bookingRepository.findAll();
        
        // 1. Calculate Top Resources
        Map<String, Long> resourceCounts = bookings.stream()
            .collect(Collectors.groupingBy(Booking::getResourceId, Collectors.counting()));
            
        // Map Resource IDs to Resource Names and sort by count descending
        List<Map<String, Object>> topResources = resourceCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(5)
            .map(entry -> {
                Resource resource = resourceRepository.findById(entry.getKey()).orElse(null);
                String name = resource != null ? resource.getName() : "Unknown Resource";
                return Map.<String, Object>of("name", name, "count", entry.getValue());
            })
            .collect(Collectors.toList());

        // 2. Calculate Peak Booking Hours
        // Initialize all hours with 0
        Map<Integer, Long> hourCounts = new HashMap<>();
        for (int i = 0; i < 24; i++) {
            hourCounts.put(i, 0L);
        }
        
        // Count bookings per hour
        for (Booking booking : bookings) {
            if (booking.getStartTime() != null) {
                int hour = booking.getStartTime().getHour();
                hourCounts.put(hour, hourCounts.get(hour) + 1);
            }
        }
        
        // Format for frontend
        List<Map<String, Object>> peakHours = hourCounts.entrySet().stream()
            .map(entry -> {
                String label = String.format("%02d:00", entry.getKey());
                return Map.<String, Object>of("hour", label, "count", entry.getValue());
            })
            // sort by hour mathematically
            .sorted((a, b) -> ((String)a.get("hour")).compareTo((String)b.get("hour")))
            .collect(Collectors.toList());

        return Map.of(
            "topResources", topResources,
            "peakHours", peakHours,
            "totalBookings", bookings.size()
        );
    }
}
