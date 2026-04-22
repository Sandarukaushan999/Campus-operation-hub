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
//
// The *Name / *Email / assignedToRole fields are enriched by the service
// (using a single batched user lookup) so the frontend can render real
// names without hitting the admin-only /api/users endpoint.
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
    String createdByName,
    String createdByEmail,

    String assignedTo,
    String assignedToName,
    String assignedToEmail,
    String assignedToRole,

    TicketStatus status,

    String resolutionNotes,
    String rejectionReason,

    Instant createdAt,
    Instant updatedAt
) {
}
