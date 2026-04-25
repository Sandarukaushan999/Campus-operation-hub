package com.campus.modules.tickets.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Body for PUT /api/tickets/{ticketId}/comments/{commentId}
//
// Only the original author can edit their own comment.
public record UpdateCommentRequest(

    @NotBlank(message = "Comment text is required")
    @Size(max = 1000, message = "Comment is too long (max 1000 characters)")
    String text
) {
}
