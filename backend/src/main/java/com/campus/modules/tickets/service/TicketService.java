package com.campus.modules.tickets.service;

import com.campus.common.enums.TicketStatus;
import com.campus.common.enums.UserRole;
import com.campus.modules.tickets.dto.AssignTicketRequest;
import com.campus.modules.tickets.dto.CreateTicketRequest;
import com.campus.modules.tickets.dto.TicketResponse;
import com.campus.modules.tickets.dto.UpdateTicketStatusRequest;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

// Business operations for tickets. The implementation lives in TicketServiceImpl.
//
// We expose an interface (and not just the impl class) so:
//   - controllers depend on the abstraction, not the implementation
//   - we can swap or mock the impl in tests
//   - it matches the team style (BookingService / ResourceService etc.)
public interface TicketService {

    // Create a new ticket. attachments may be null or empty.
    TicketResponse createTicket(String userId, CreateTicketRequest request, List<MultipartFile> attachments);

    // Tickets reported by a specific user.
    List<TicketResponse> getMyTickets(String userId);

    // Tickets assigned to a specific technician.
    List<TicketResponse> getAssignedTickets(String technicianId);

    // All tickets in the system. statusFilter may be null = no filter.
    List<TicketResponse> getAllTickets(TicketStatus statusFilter);

    // Single ticket details. Permission checked - only owner, assignee or admin.
    TicketResponse getTicketById(String ticketId, String actorId, UserRole actorRole);

    // Admin assigns a technician to a ticket. Status moves OPEN -> ASSIGNED.
    TicketResponse assignTicket(String ticketId, AssignTicketRequest request);

    // Workflow status change. The implementation enforces the state machine.
    TicketResponse updateStatus(String ticketId, String actorId, UserRole actorRole, UpdateTicketStatusRequest request);

    // Hard delete the ticket, its comments and its attachments.
    // Allowed for admin always, or for the owner only while status = OPEN.
    void deleteTicket(String ticketId, String actorId, UserRole actorRole);

    // Load one attachment file. Permission checked the same as getTicketById.
    AttachmentDownload loadAttachment(String ticketId, String filename, String actorId, UserRole actorRole);

    // Small bundle returned by loadAttachment so the controller has everything
    // it needs to stream the file back to the browser.
    record AttachmentDownload(Resource resource, String contentType, String filename) {
    }
}
