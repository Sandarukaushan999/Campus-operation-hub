package com.campus.modules.notifications.service;

import com.campus.modules.notifications.dto.NotificationResponse;
import java.util.List;

public interface NotificationService {
    long getUnreadCount(String userId);

    List<NotificationResponse> getMyNotifications(String userId, int limit);

    void markRead(String notificationId, String actorUserId);

    void markAllRead(String userId);
}

