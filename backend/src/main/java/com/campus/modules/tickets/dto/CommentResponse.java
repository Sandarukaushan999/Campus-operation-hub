package com.campus.modules.tickets.dto;

import java.time.Instant;

// What the API returns for a single ticket comment.
public record CommentResponse(
    String id,
    String ticketId,
    String userId,
    String text,
    Instant createdAt,
    Instant updatedAt
) {
}
