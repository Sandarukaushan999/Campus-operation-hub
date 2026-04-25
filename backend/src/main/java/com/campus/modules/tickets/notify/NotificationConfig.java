package com.campus.modules.tickets.notify;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Provides a fallback NotificationPublisher bean that does nothing.
//
// Why: Module C (tickets) wants to send notifications when a ticket
// status changes, but Module D (the real notification system) is built
// by another team member and may not be merged yet. We don't want
// Module C to fail to start just because Module D isn't there.
//
// @ConditionalOnMissingBean means: only register this no-op bean if
// nobody else has provided a NotificationPublisher. As soon as Member 4
// ships their real @Service, Spring picks up that one instead and our
// fallback disappears - no code change needed on our side.
@Configuration
public class NotificationConfig {

    @Bean
    @ConditionalOnMissingBean(NotificationPublisher.class)
    public NotificationPublisher fallbackNotificationPublisher() {
        // Tiny lambda - the real one will be a full @Service from Member 4
        return (userId, type, title, message) -> {
            // intentionally empty - this is a placeholder until Module D ships
        };
    }
}
