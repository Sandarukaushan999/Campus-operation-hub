package com.campus.modules.tickets.controller;

import com.campus.common.enums.TicketCategory;
import com.campus.common.enums.TicketPriority;
import com.campus.common.enums.TicketStatus;
import com.campus.common.response.ApiResponse;
import com.campus.domain.User;
import com.campus.modules.tickets.dto.AssignTicketRequest;
import com.campus.modules.tickets.dto.CreateTicketRequest;
import com.campus.modules.tickets.dto.TicketResponse;
import com.campus.modules.tickets.dto.UpdateTicketStatusRequest;
import com.campus.modules.tickets.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

// HTTP endpoints for Module C (Maintenance & Incident Tickets).
//
// Style note: this controller follows the same pattern as BookingController -
// it pulls the actor from the JWT principal, calls the service, and wraps the
// response with ApiResponse. All errors bubble up to GlobalExceptionHandler.
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    // ----------------------------------------------------------------------
    // Create
    // ----------------------------------------------------------------------

    // POST /api/tickets
    //
    // Sent as multipart/form-data because the user can attach up to 3 images.
    // We collect each text field with @RequestParam and the files with
    // @RequestParam("attachments"). Validation is done in the service.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TicketResponse>> create(
        Authentication authentication,
        @RequestParam(value = "resourceId", required = false) String resourceId,
        @RequestParam(value = "location", required = false) String location,
        @RequestParam("title") String title,
        @RequestParam("description") String description,
        @RequestParam("category") TicketCategory category,
        @RequestParam("priority") TicketPriority priority,
        @RequestParam("contactDetails") String contactDetails,
        @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments
    ) {
        User user = (User) authentication.getPrincipal();

        // Build the DTO from the form fields. The record is just a container -
        // the service is the one that does the real work.
        CreateTicketRequest request = new CreateTicketRequest(
            resourceId,
            location,
            title,
            description,
            category,
            priority,
            contactDetails
        );

        TicketResponse response = ticketService.createTicket(user.getId(), request, attachments);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created("Ticket created", response));
    }

    // ----------------------------------------------------------------------
    // Read
    // ----------------------------------------------------------------------

    // GET /api/tickets/my
    // Returns tickets reported by the caller.
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getMyTickets(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<TicketResponse> tickets = ticketService.getMyTickets(user.getId());
        return ResponseEntity.ok(ApiResponse.ok("My tickets fetched", tickets));
    }

    // GET /api/tickets/assigned
    // Returns tickets assigned to the caller (technicians, admins).
    @GetMapping("/assigned")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getAssignedTickets(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<TicketResponse> tickets = ticketService.getAssignedTickets(user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Assigned tickets fetched", tickets));
    }

    // GET /api/tickets?status=OPEN
    // Admin-only. The status query param is optional.
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getAll(
        @RequestParam(value = "status", required = false) TicketStatus status
    ) {
        List<TicketResponse> tickets = ticketService.getAllTickets(status);
        return ResponseEntity.ok(ApiResponse.ok("Tickets fetched", tickets));
    }

    // GET /api/tickets/{id}
    // The service does the owner / assignee / admin check.
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponse>> getById(
        @PathVariable String id,
        Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        TicketResponse response = ticketService.getTicketById(id, user.getId(), user.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Ticket fetched", response));
    }

    // ----------------------------------------------------------------------
    // Workflow
    // ----------------------------------------------------------------------

    // PATCH /api/tickets/{id}/assign
    // Admin assigns a technician. Status moves OPEN -> ASSIGNED.
    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TicketResponse>> assign(
        @PathVariable String id,
        @Valid @RequestBody AssignTicketRequest request
    ) {
        TicketResponse response = ticketService.assignTicket(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Ticket assigned", response));
    }

    // PATCH /api/tickets/{id}/status
    // Workflow status change. The service enforces the state machine.
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TicketResponse>> updateStatus(
        @PathVariable String id,
        Authentication authentication,
        @Valid @RequestBody UpdateTicketStatusRequest request
    ) {
        User user = (User) authentication.getPrincipal();
        TicketResponse response = ticketService.updateStatus(id, user.getId(), user.getRole(), request);
        return ResponseEntity.ok(ApiResponse.ok("Ticket status updated", response));
    }

    // ----------------------------------------------------------------------
    // Delete
    // ----------------------------------------------------------------------

    // DELETE /api/tickets/{id}
    // Owner can delete only while OPEN. Admin can delete any time.
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
        @PathVariable String id,
        Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        ticketService.deleteTicket(id, user.getId(), user.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Ticket deleted", null));
    }

    // ----------------------------------------------------------------------
    // Attachment download
    // ----------------------------------------------------------------------

    // GET /api/tickets/{id}/attachments/{filename}
    // Streams the image back to the browser. Permission and path-traversal
    // checks live in the service.
    //
    // This is the ONLY endpoint that does not wrap its response in ApiResponse,
    // because we are streaming a binary file, not JSON.
    @GetMapping("/{id}/attachments/{filename:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadAttachment(
        @PathVariable String id,
        @PathVariable String filename,
        Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        TicketService.AttachmentDownload download = ticketService.loadAttachment(
            id, filename, user.getId(), user.getRole()
        );

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(download.contentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + download.filename() + "\"")
            .body(download.resource());
    }
}
