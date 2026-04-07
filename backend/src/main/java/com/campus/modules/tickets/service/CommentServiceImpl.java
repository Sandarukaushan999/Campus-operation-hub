package com.campus.modules.tickets.service;

import com.campus.common.enums.UserRole;
import com.campus.common.exception.BadRequestException;
import com.campus.common.exception.ResourceNotFoundException;
import com.campus.domain.Comment;
import com.campus.domain.Ticket;
import com.campus.modules.tickets.dto.CommentResponse;
import com.campus.modules.tickets.dto.CreateCommentRequest;
import com.campus.modules.tickets.dto.UpdateCommentRequest;
import com.campus.modules.tickets.notify.NotificationPublisher;
import com.campus.repository.CommentRepository;
import com.campus.repository.TicketRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// Business logic for ticket comments.
//
// Permission rules implemented here:
//   - viewing / adding   : ticket owner, assignee, or admin
//   - editing            : ONLY the original author (admin cannot edit other people's comments)
//   - deleting           : original author OR admin
@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final NotificationPublisher notificationPublisher;

    @Override
    public CommentResponse addComment(String ticketId, String userId, UserRole userRole, CreateCommentRequest request) {
        Ticket ticket = loadTicket(ticketId);
        ensureCanAccess(ticket, userId, userRole);

        Instant now = Instant.now();
        Comment comment = Comment.builder()
            .ticketId(ticketId)
            .userId(userId)
            .text(request.text().trim())
            .createdAt(now)
            .updatedAt(now)
            .build();

        Comment saved = commentRepository.save(comment);

        // Notify the ticket owner that someone commented (unless they commented themselves).
        if (!ticket.getCreatedBy().equals(userId)) {
            notificationPublisher.notify(
                ticket.getCreatedBy(),
                "TICKET_NEW_COMMENT",
                "New comment on your ticket",
                "Someone commented on: " + ticket.getTitle()
            );
        }

        // Also notify the assignee (if any) so they don't miss user replies.
        if (ticket.getAssignedTo() != null && !ticket.getAssignedTo().equals(userId)) {
            notificationPublisher.notify(
                ticket.getAssignedTo(),
                "TICKET_NEW_COMMENT",
                "New comment on a ticket you are working on",
                "Someone commented on: " + ticket.getTitle()
            );
        }

        return toResponse(saved);
    }

    @Override
    public List<CommentResponse> getComments(String ticketId, String actorId, UserRole actorRole) {
        Ticket ticket = loadTicket(ticketId);
        ensureCanAccess(ticket, actorId, actorRole);

        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    public CommentResponse editComment(String ticketId, String commentId, String userId, UpdateCommentRequest request) {
        Comment comment = loadComment(commentId);

        // Sanity check: the URL says it belongs to this ticket, the document must agree.
        if (!comment.getTicketId().equals(ticketId)) {
            throw new BadRequestException("Comment does not belong to this ticket");
        }

        // ONLY the author can edit. Even an admin cannot rewrite somebody else's words.
        if (!comment.getUserId().equals(userId)) {
            throw new BadRequestException("You can only edit your own comment");
        }

        comment.setText(request.text().trim());
        comment.setUpdatedAt(Instant.now());
        return toResponse(commentRepository.save(comment));
    }

    @Override
    public void deleteComment(String ticketId, String commentId, String userId, UserRole userRole) {
        Comment comment = loadComment(commentId);

        if (!comment.getTicketId().equals(ticketId)) {
            throw new BadRequestException("Comment does not belong to this ticket");
        }

        // The author can delete their own comment. An admin can delete anyone's.
        boolean isAuthor = comment.getUserId().equals(userId);
        boolean isAdmin = userRole == UserRole.ADMIN;
        if (!isAuthor && !isAdmin) {
            throw new BadRequestException("You can only delete your own comment");
        }

        commentRepository.delete(comment);
    }

    // ---------- helpers ----------

    private Ticket loadTicket(String ticketId) {
        return ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
    }

    private Comment loadComment(String commentId) {
        return commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
    }

    // Same access rule as TicketServiceImpl: owner, assignee or admin.
    private void ensureCanAccess(Ticket ticket, String actorId, UserRole actorRole) {
        if (actorRole == UserRole.ADMIN) {
            return;
        }
        boolean isOwner = ticket.getCreatedBy().equals(actorId);
        boolean isAssignee = ticket.getAssignedTo() != null && ticket.getAssignedTo().equals(actorId);
        if (!isOwner && !isAssignee) {
            throw new BadRequestException("You are not allowed to comment on this ticket");
        }
    }

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
            comment.getId(),
            comment.getTicketId(),
            comment.getUserId(),
            comment.getText(),
            comment.getCreatedAt(),
            comment.getUpdatedAt()
        );
    }
}
