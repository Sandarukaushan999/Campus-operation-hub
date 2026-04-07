package com.campus.modules.tickets.dto;

import com.campus.common.enums.TicketCategory;
import com.campus.common.enums.TicketPriority;
import com.campus.common.enums.TicketStatus;
import java.time.Instant;
import java.util.List;

// What the API returns for a ticket. We never return the raw entity -
// this record is the public shape that the frontend understands.
//
// attachmentUrls are full URL paths the frontend can use directly,
// like "/api/tickets/abc123/attachments/uuid.png"
public record TicketResponse(

    String id,

    String resourceId,
    String location,

    String title,
    String description,

    TicketCategory category,
    TicketPriority priority,

    String contactDetails,

    List<String> attachmentUrls,

    String createdBy,
    String assignedTo,

    TicketStatus status,

    String resolutionNotes,
    String rejectionReason,

    Instant createdAt,
    Instant updatedAt
) {
}
