package com.campus.modules.tickets.dto;

import jakarta.validation.constraints.NotBlank;

// Body for PATCH /api/tickets/{id}/assign
//
// Admin sends the user id of the technician they want to assign.
// The service checks the user exists and has role TECHNICIAN (or ADMIN).
public record AssignTicketRequest(

    @NotBlank(message = "Technician id is required")
    String technicianId
) {
}
