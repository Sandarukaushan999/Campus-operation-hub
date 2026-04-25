package com.campus.modules.tickets.service;

import com.campus.common.enums.TicketStatus;
import com.campus.common.enums.UserRole;
import com.campus.common.exception.BadRequestException;
import com.campus.common.exception.ConflictException;
import com.campus.common.exception.ForbiddenException;
import com.campus.common.exception.ResourceNotFoundException;
import com.campus.domain.Resource;
import com.campus.domain.Ticket;
import com.campus.domain.User;
import com.campus.modules.tickets.dto.AssignTicketRequest;
import com.campus.modules.tickets.dto.CreateTicketRequest;
import com.campus.modules.tickets.dto.TicketResponse;
import com.campus.modules.tickets.dto.UpdateTicketStatusRequest;
import com.campus.modules.tickets.notify.NotificationPublisher;
import com.campus.modules.tickets.storage.FileStorageService;
import com.campus.repository.CommentRepository;
import com.campus.repository.ResourceRepository;
import com.campus.repository.TicketRepository;
import com.campus.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

// Business logic for tickets.
//
// Things this class is responsible for:
//   - validating new tickets and saving them
//   - the ticket workflow state machine (who can move what to where)
//   - cascade-deleting comments and attachment files
//   - sending notifications when interesting things happen
//
// Things this class does NOT do:
//   - HTTP / multipart parsing  (that is the controller's job)
//   - file IO  (delegated to FileStorageService)
@Slf4j
@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    // The maximum number of image attachments allowed per ticket.
    // The assignment says 3, the FileStorageService also enforces size and type.
    private static final int MAX_ATTACHMENTS = 3;

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationPublisher notificationPublisher;

    // ----------------------------------------------------------------------
    // Create
    // ----------------------------------------------------------------------

    @Override
    public TicketResponse createTicket(String userId, CreateTicketRequest request, List<MultipartFile> attachments) {
        if (request == null) {
            throw new BadRequestException("Request body is required");
        }
        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException("Title is required");
        }
        if (request.description() == null || request.description().isBlank()) {
            throw new BadRequestException("Description is required");
        }
        if (request.contactDetails() == null || request.contactDetails().isBlank()) {
            throw new BadRequestException("Contact details are required");
        }
        if (request.category() == null) {
            throw new BadRequestException("Category is required");
        }
        if (request.priority() == null) {
            throw new BadRequestException("Priority is required");
        }

        // The user must point at SOMETHING. Either a known resource or a free-text location.
        boolean hasResource = request.resourceId() != null && !request.resourceId().isBlank();
        boolean hasLocation = request.location() != null && !request.location().isBlank();
        if (!hasResource && !hasLocation) {
            throw new BadRequestException("Please provide a resource or a location for the ticket");
        }

        // If they pointed at a resource, make sure it actually exists.
        if (hasResource) {
            resourceRepository.findById(request.resourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        }

        // No more than 3 image files. Anything else is rejected before we touch the disk.
        List<MultipartFile> safeAttachments = attachments == null ? List.of() : attachments;
        if (safeAttachments.size() > MAX_ATTACHMENTS) {
            throw new BadRequestException("A ticket can have at most " + MAX_ATTACHMENTS + " attachments");
        }

        // Save each file. FileStorageService validates type and size.
        // We collect the safe filenames to store on the ticket document.
        List<String> savedFilenames = new ArrayList<>();
        for (MultipartFile file : safeAttachments) {
            if (file != null && !file.isEmpty()) {
                savedFilenames.add(fileStorageService.save(file));
            }
        }

        // Build the ticket entity. Trim user input so we don't store stray spaces.
        Instant now = Instant.now();
        Ticket ticket = Ticket.builder()
            .resourceId(hasResource ? request.resourceId() : null)
            .location(hasLocation ? request.location().trim() : null)
            .title(request.title().trim())
            .description(request.description().trim())
            .category(request.category())
            .priority(request.priority())
            .contactDetails(request.contactDetails().trim())
            .attachments(savedFilenames)
            .createdBy(userId)
            .status(TicketStatus.OPEN)
            .createdAt(now)
            .updatedAt(now)
            .build();

        Ticket saved = ticketRepository.save(ticket);
        return toResponse(saved);
    }

    // ----------------------------------------------------------------------
    // Read
    // ----------------------------------------------------------------------

    @Override
    public List<TicketResponse> getMyTickets(String userId) {
        List<Ticket> tickets = ticketRepository.findByCreatedByOrderByCreatedAtDesc(userId);
        java.util.Map<String, User> users = loadUserLookup(tickets);
        return tickets.stream().map(t -> toResponse(t, users)).toList();
    }

    @Override
    public List<TicketResponse> getAssignedTickets(String technicianId) {
        List<Ticket> tickets = ticketRepository.findByAssignedToOrderByCreatedAtDesc(technicianId);
        java.util.Map<String, User> users = loadUserLookup(tickets);
        return tickets.stream().map(t -> toResponse(t, users)).toList();
    }

    @Override
    public List<TicketResponse> getAllTickets(TicketStatus statusFilter) {
        // If no status filter is provided we just return everything newest first.
        List<Ticket> tickets = (statusFilter == null)
            ? ticketRepository.findAllByOrderByCreatedAtDesc()
            : ticketRepository.findByStatusOrderByCreatedAtDesc(statusFilter);

        java.util.Map<String, User> users = loadUserLookup(tickets);
        return tickets.stream().map(t -> toResponse(t, users)).toList();
    }

    @Override
    public TicketResponse getTicketById(String ticketId, String actorId, UserRole actorRole) {
        Ticket ticket = loadTicket(ticketId);
        ensureCanView(ticket, actorId, actorRole);
        return toResponse(ticket);
    }

    // ----------------------------------------------------------------------
    // Workflow
    // ----------------------------------------------------------------------

    @Override
    public TicketResponse assignTicket(String ticketId, AssignTicketRequest request) {
        Ticket ticket = loadTicket(ticketId);

        // We only assign tickets that are still OPEN. If it has moved past that
        // (already assigned, in progress, etc.) the admin should not be using
        // this endpoint - they should use status update.
        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new ConflictException("Only open tickets can be assigned");
        }

        // The technician must exist and must be a TECHNICIAN or ADMIN.
        User technician = userRepository.findById(request.technicianId())
            .orElseThrow(() -> new ResourceNotFoundException("Technician not found"));

        if (technician.getRole() != UserRole.TECHNICIAN && technician.getRole() != UserRole.ADMIN) {
            throw new BadRequestException("Selected user is not a technician");
        }

        ticket.setAssignedTo(technician.getId());
        ticket.setStatus(TicketStatus.ASSIGNED);
        ticket.setUpdatedAt(Instant.now());

        Ticket saved = ticketRepository.save(ticket);

        // Tell the reporter that someone is on it.
        notificationPublisher.notify(
            saved.getCreatedBy(),
            "TICKET_STATUS_CHANGED",
            "Your ticket has been assigned",
            "A technician is now looking into: " + saved.getTitle()
        );

        return toResponse(saved);
    }

    @Override
    public TicketResponse updateStatus(String ticketId, String actorId, UserRole actorRole, UpdateTicketStatusRequest request) {
        Ticket ticket = loadTicket(ticketId);

        TicketStatus from = ticket.getStatus();
        TicketStatus to = request.status();

        // No-op moves are silly but should not be a hard error.
        if (from == to) {
            throw new BadRequestException("Ticket is already in status " + to);
        }

        // The state machine. If a transition is not listed here it is rejected.
        boolean isAdmin = actorRole == UserRole.ADMIN;
        boolean isAssignee = ticket.getAssignedTo() != null && ticket.getAssignedTo().equals(actorId);
        boolean isOwner = ticket.getCreatedBy().equals(actorId);

        switch (from) {
            case OPEN -> {
                // From OPEN we only support REJECTED here. Assigning uses the assign endpoint.
                if (to != TicketStatus.REJECTED) {
                    throw new BadRequestException("Open tickets can only be rejected (use assign to start work)");
                }
                if (!isAdmin) {
                    throw new ForbiddenException("Only an admin can reject a ticket");
                }
            }
            case ASSIGNED -> {
                if (to == TicketStatus.IN_PROGRESS) {
                    if (!isAssignee && !isAdmin) {
                        throw new ForbiddenException("Only the assigned technician can start work");
                    }
                } else if (to == TicketStatus.REJECTED) {
                    if (!isAdmin) {
                        throw new ForbiddenException("Only an admin can reject a ticket");
                    }
                } else {
                    throw new BadRequestException("Assigned tickets can only move to in-progress or rejected");
                }
            }
            case IN_PROGRESS -> {
                if (to == TicketStatus.RESOLVED) {
                    if (!isAssignee && !isAdmin) {
                        throw new ForbiddenException("Only the assigned technician can resolve a ticket");
                    }
                } else if (to == TicketStatus.REJECTED) {
                    if (!isAdmin) {
                        throw new ForbiddenException("Only an admin can reject a ticket");
                    }
                } else {
                    throw new BadRequestException("In-progress tickets can only move to resolved or rejected");
                }
            }
            case RESOLVED -> {
                // The user can either close the ticket or push it back to in-progress
                // (re-open) if the issue is not really fixed.
                if (to == TicketStatus.CLOSED) {
                    if (!isOwner && !isAdmin) {
                        throw new ForbiddenException("Only the ticket owner can close it");
                    }
                } else if (to == TicketStatus.IN_PROGRESS) {
                    if (!isOwner && !isAdmin) {
                        throw new ForbiddenException("Only the ticket owner can re-open it");
                    }
                } else {
                    throw new BadRequestException("Resolved tickets can only be closed or re-opened");
                }
            }
            case CLOSED, REJECTED -> throw new ConflictException("Ticket is already in a final state");
            default -> throw new BadRequestException("Unknown status transition");
        }

        // Required-fields check for the two transitions that need notes.
        if (to == TicketStatus.RESOLVED) {
            if (request.resolutionNotes() == null || request.resolutionNotes().isBlank()) {
                throw new BadRequestException("Please provide resolution notes");
            }
            ticket.setResolutionNotes(request.resolutionNotes().trim());
        }
        if (to == TicketStatus.REJECTED) {
            if (request.rejectionReason() == null || request.rejectionReason().isBlank()) {
                throw new BadRequestException("Please provide a reason for rejecting the ticket");
            }
            ticket.setRejectionReason(request.rejectionReason().trim());
        }

        ticket.setStatus(to);
        ticket.setUpdatedAt(Instant.now());
        Ticket saved = ticketRepository.save(ticket);

        // Notify the reporter that something changed on their ticket.
        notificationPublisher.notify(
            saved.getCreatedBy(),
            "TICKET_STATUS_CHANGED",
            "Ticket status: " + to.name(),
            "Your ticket \"" + saved.getTitle() + "\" is now " + to.name()
        );

        return toResponse(saved);
    }

    // ----------------------------------------------------------------------
    // Delete
    // ----------------------------------------------------------------------

    @Override
    public void deleteTicket(String ticketId, String actorId, UserRole actorRole) {
        Ticket ticket = loadTicket(ticketId);

        boolean isAdmin = actorRole == UserRole.ADMIN;
        boolean isOwner = ticket.getCreatedBy().equals(actorId);

        if (!isAdmin && !isOwner) {
            throw new ForbiddenException("You can only delete your own ticket");
        }

        // Owners can only delete while the ticket is still OPEN. Once a technician
        // is involved or work is done, deleting would erase a real audit trail.
        if (!isAdmin && ticket.getStatus() != TicketStatus.OPEN) {
            throw new BadRequestException("You can only delete a ticket while it is still open");
        }

        // Best-effort cleanup of attachment files on disk. A single failure
        // should not block the DB delete, but it should leave a server-side
        // trail so orphans can be cleaned up later.
        for (String filename : ticket.getAttachments()) {
            try {
                fileStorageService.delete(filename);
            } catch (Exception ex) {
                log.warn("Failed to delete attachment '{}' for ticket {}: {}",
                    filename, ticket.getId(), ex.getMessage());
            }
        }

        // Wipe any comments tied to this ticket so we do not leave orphans.
        commentRepository.deleteByTicketId(ticket.getId());

        // Finally remove the ticket itself.
        ticketRepository.delete(ticket);
    }

    // ----------------------------------------------------------------------
    // Attachments
    // ----------------------------------------------------------------------

    @Override
    public AttachmentDownload loadAttachment(String ticketId, String filename, String actorId, UserRole actorRole) {
        Ticket ticket = loadTicket(ticketId);
        ensureCanView(ticket, actorId, actorRole);

        // Make sure the requested filename actually belongs to THIS ticket.
        // Without this check anyone who can view ticket A could guess filenames
        // from ticket B.
        if (!ticket.getAttachments().contains(filename)) {
            throw new BadRequestException("Attachment does not belong to this ticket");
        }

        org.springframework.core.io.Resource resource = fileStorageService.load(filename);
        String contentType = fileStorageService.detectContentType(filename);
        return new AttachmentDownload(resource, contentType, filename);
    }

    // ----------------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------------

    // Load a ticket by id or throw a clean 404. Used everywhere above.
    private Ticket loadTicket(String ticketId) {
        return ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
    }

    // Permission rule used by view and download endpoints.
    private void ensureCanView(Ticket ticket, String actorId, UserRole actorRole) {
        if (actorRole == UserRole.ADMIN) {
            return;
        }
        boolean isOwner = ticket.getCreatedBy().equals(actorId);
        boolean isAssignee = ticket.getAssignedTo() != null && ticket.getAssignedTo().equals(actorId);
        if (!isOwner && !isAssignee) {
            throw new ForbiddenException("You are not allowed to view this ticket");
        }
    }

    // Map a Ticket entity to the public TicketResponse DTO.
    // Builds full URL paths for the attachments so the frontend can use them
    // directly in <img src="..."> tags.
    private TicketResponse toResponse(Ticket ticket) {
        return toResponse(ticket, java.util.Map.of());
    }

    // Variant that takes a pre-built userId -> User lookup so a list mapping
    // can resolve all names with ONE database round-trip instead of N.
    private TicketResponse toResponse(Ticket ticket, java.util.Map<String, User> userLookup) {
        List<String> attachmentUrls = ticket.getAttachments()
            .stream()
            .map(filename -> "/api/tickets/" + ticket.getId() + "/attachments/" + filename)
            .toList();

        User reporter = ticket.getCreatedBy() != null ? userLookup.get(ticket.getCreatedBy()) : null;
        if (reporter == null && ticket.getCreatedBy() != null) {
            reporter = userRepository.findById(ticket.getCreatedBy()).orElse(null);
        }

        User assignee = null;
        if (ticket.getAssignedTo() != null) {
            assignee = userLookup.get(ticket.getAssignedTo());
            if (assignee == null) {
                assignee = userRepository.findById(ticket.getAssignedTo()).orElse(null);
            }
        }

        return new TicketResponse(
            ticket.getId(),
            ticket.getResourceId(),
            ticket.getLocation(),
            ticket.getTitle(),
            ticket.getDescription(),
            ticket.getCategory(),
            ticket.getPriority(),
            ticket.getContactDetails(),
            attachmentUrls,
            ticket.getCreatedBy(),
            reporter != null ? reporter.getFullName() : null,
            reporter != null ? reporter.getEmail() : null,
            ticket.getAssignedTo(),
            assignee != null ? assignee.getFullName() : null,
            assignee != null ? assignee.getEmail() : null,
            assignee != null && assignee.getRole() != null ? assignee.getRole().name() : null,
            ticket.getStatus(),
            ticket.getResolutionNotes(),
            ticket.getRejectionReason(),
            ticket.getCreatedAt(),
            ticket.getUpdatedAt()
        );
    }

    // Build a userId -> User lookup from a list of tickets with ONE DB hit.
    // Used by the list endpoints so we don't do N findById calls.
    private java.util.Map<String, User> loadUserLookup(List<Ticket> tickets) {
        java.util.Set<String> userIds = new java.util.HashSet<>();
        for (Ticket t : tickets) {
            if (t.getCreatedBy() != null) userIds.add(t.getCreatedBy());
            if (t.getAssignedTo() != null) userIds.add(t.getAssignedTo());
        }
        if (userIds.isEmpty()) return java.util.Map.of();

        java.util.Map<String, User> map = new java.util.HashMap<>();
        userRepository.findAllById(userIds).forEach(u -> map.put(u.getId(), u));
        return map;
    }
}
