package com.campus.modules.notifications.service;

import com.campus.common.exception.ForbiddenException;
import com.campus.common.exception.ResourceNotFoundException;
import com.campus.domain.Notification;
import com.campus.modules.notifications.dto.NotificationResponse;
import com.campus.repository.NotificationRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    public List<NotificationResponse> getMyNotifications(String userId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .limit(safeLimit)
            .map(this::toResponse)
            .toList();
    }

    @Override
    public void markRead(String notificationId, String actorUserId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUserId().equals(actorUserId)) {
            throw new ForbiddenException("You are not allowed to update this notification");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Override
    public void markAllRead(String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        boolean changed = false;
        for (Notification n : notifications) {
            if (!n.isRead()) {
                n.setRead(true);
                changed = true;
            }
        }
        if (changed) {
            notificationRepository.saveAll(notifications);
        }
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getTitle(),
            notification.getMessage(),
            notification.getType(),
            notification.isRead(),
            notification.getCreatedAt()
        );
    }
}

