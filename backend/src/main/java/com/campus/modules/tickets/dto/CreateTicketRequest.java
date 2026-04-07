package com.campus.modules.tickets.dto;

import com.campus.common.enums.TicketCategory;
import com.campus.common.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Body for POST /api/tickets (sent as multipart/form-data because of attachments).
//
// Either resourceId OR location must be provided. We can't express that
// with a single annotation, so the service checks it manually.
public record CreateTicketRequest(

    String resourceId,                                    // optional - id of a Resource document
    String location,                                      // optional - free text like "Block A, Room 12"

    @NotBlank(message = "Title is required")
    @Size(max = 120, message = "Title is too long (max 120 characters)")
    String title,

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description is too long (max 2000 characters)")
    String description,

    @NotNull(message = "Category is required")
    TicketCategory category,

    @NotNull(message = "Priority is required")
    TicketPriority priority,

    @NotBlank(message = "Contact details are required")
    @Size(max = 120, message = "Contact details are too long (max 120 characters)")
    String contactDetails
) {
}
