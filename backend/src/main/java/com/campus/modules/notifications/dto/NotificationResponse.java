package com.campus.modules.notifications.dto;

import com.campus.common.enums.NotificationType;
import java.time.Instant;

public record NotificationResponse(
    String id,
    String title,
    String message,
    NotificationType type,
    boolean read,
    Instant createdAt
) {
}

