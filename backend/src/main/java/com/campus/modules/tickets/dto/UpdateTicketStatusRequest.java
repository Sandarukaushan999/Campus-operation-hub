package com.campus.modules.tickets.dto;

import com.campus.common.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;

// Body for PATCH /api/tickets/{id}/status
//
// The service decides whether the transition is allowed based on the
// caller's role and the current status of the ticket.
//
// resolutionNotes is required when status = RESOLVED.
// rejectionReason is required when status = REJECTED.
public record UpdateTicketStatusRequest(

    @NotNull(message = "Status is required")
    TicketStatus status,

    String resolutionNotes,
    String rejectionReason
) {
}
