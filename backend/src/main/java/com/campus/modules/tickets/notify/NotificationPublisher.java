package com.campus.modules.tickets.notify;

// Tiny "send a notification" interface used by Module C.
//
// Module D (Notifications - Member 4) will provide the real implementation.
// Until then we ship a no-op fallback (see NotificationConfig) so this
// module compiles and runs without depending on Member 4's code.
//
// When Member 4 is ready they just need to create a @Service implementing
// this interface - Spring will pick it up automatically and our no-op
// bean will be ignored (see @ConditionalOnMissingBean in NotificationConfig).
public interface NotificationPublisher {

    // Send a notification to one user.
    //
    // userId  - the recipient (target user)
    // type    - short code like "TICKET_STATUS_CHANGED" or "TICKET_NEW_COMMENT"
    // title   - short headline shown in the UI
    // message - longer body text shown when the user opens the notification
    void notify(String userId, String type, String title, String message);
}
