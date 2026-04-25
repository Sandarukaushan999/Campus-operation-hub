package com.campus.modules.tickets.service;

import com.campus.common.enums.UserRole;
import com.campus.modules.tickets.dto.CommentResponse;
import com.campus.modules.tickets.dto.CreateCommentRequest;
import com.campus.modules.tickets.dto.UpdateCommentRequest;
import java.util.List;

// Operations for ticket comments. Implementation in CommentServiceImpl.
//
// Comment ownership rules (from the assignment):
//   - anyone who can view the ticket may add a comment
//   - only the original author may edit their own comment
//   - the original author OR an admin may delete a comment
public interface CommentService {

    // Add a new comment to a ticket.
    CommentResponse addComment(String ticketId, String userId, UserRole userRole, CreateCommentRequest request);

    // List all comments on a ticket (oldest first).
    List<CommentResponse> getComments(String ticketId, String actorId, UserRole actorRole);

    // Edit an existing comment - author only.
    CommentResponse editComment(String ticketId, String commentId, String userId, UpdateCommentRequest request);

    // Delete a comment - author or admin.
    void deleteComment(String ticketId, String commentId, String userId, UserRole userRole);
}
