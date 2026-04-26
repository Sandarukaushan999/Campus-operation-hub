package com.campus.modules.notifications.service;

import com.campus.common.enums.NotificationType;
import com.campus.domain.Notification;
import com.campus.modules.tickets.notify.NotificationPublisher;
import com.campus.repository.NotificationRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MongoNotificationPublisher implements NotificationPublisher {

    private final NotificationRepository notificationRepository;

    @Override
    public void notify(String userId, String type, String title, String message) {
        Notification notification = Notification.builder()
            .userId(userId)
            .title(title)
            .message(message)
            .type(resolveType(type))
            .read(false)
            .createdAt(Instant.now())
            .build();

        notificationRepository.save(notification);
    }

    private static NotificationType resolveType(String type) {
        if (type == null) return NotificationType.SYSTEM;
        String upper = type.toUpperCase();
        if (upper.contains("BOOKING")) return NotificationType.BOOKING;
        if (upper.contains("TICKET")) return NotificationType.TICKET;
        if (upper.contains("GENERAL")) return NotificationType.GENERAL;
        return NotificationType.SYSTEM;
    }
}

