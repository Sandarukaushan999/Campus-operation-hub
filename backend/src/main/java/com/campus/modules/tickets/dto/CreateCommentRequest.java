package com.campus.modules.tickets.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Body for POST /api/tickets/{ticketId}/comments
public record CreateCommentRequest(

    @NotBlank(message = "Comment text is required")
    @Size(max = 1000, message = "Comment is too long (max 1000 characters)")
    String text
) {
}
