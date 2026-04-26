package com.campus.modules.notifications.controller;

import com.campus.common.response.ApiResponse;
import com.campus.domain.User;
import com.campus.modules.notifications.dto.NotificationResponse;
import com.campus.modules.notifications.service.NotificationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/my/unread-count")
    public ResponseEntity<ApiResponse<Long>> myUnreadCount(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok("Unread count fetched", notificationService.getUnreadCount(user.getId())));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> myNotifications(
        Authentication authentication,
        @RequestParam(defaultValue = "10") int limit
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(
            "Notifications fetched",
            notificationService.getMyNotifications(user.getId(), limit)
        ));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable String id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        notificationService.markRead(id, user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Notification marked read", null));
    }

    @PutMapping("/my/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked read", null));
    }
}

