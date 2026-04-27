package com.campus.modules.notifications.service;

import com.campus.common.enums.NotificationType;
import com.campus.domain.Notification;
import com.campus.modules.tickets.notify.NotificationPublisher;
import com.campus.repository.NotificationRepository;
import com.campus.repository.UserRepository;
import com.campus.domain.User;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MongoNotificationPublisher implements NotificationPublisher {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    public void notify(String userId, String type, String title, String message) {
        NotificationType resolvedType = resolveType(type);

        // Check user preferences
        if (resolvedType != NotificationType.SYSTEM) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                java.util.Map<String, Boolean> prefs = user.getNotificationPreferences();
                if (prefs != null && prefs.containsKey(resolvedType.name()) && !prefs.get(resolvedType.name())) {
                    // User has opted out of this category
                    return;
                }
            }
        }

        Notification notification = Notification.builder()
            .userId(userId)
            .title(title)
            .message(message)
            .type(resolvedType)
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

