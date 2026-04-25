package com.campus.modules.tickets.controller;

import com.campus.common.response.ApiResponse;
import com.campus.domain.User;
import com.campus.modules.tickets.dto.CommentResponse;
import com.campus.modules.tickets.dto.CreateCommentRequest;
import com.campus.modules.tickets.dto.UpdateCommentRequest;
import com.campus.modules.tickets.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// HTTP endpoints for ticket comments.
//
// All routes live under a ticket id so the URL itself shows the relationship:
//   /api/tickets/{ticketId}/comments
//   /api/tickets/{ticketId}/comments/{commentId}
//
// Permission rules are enforced by CommentServiceImpl.
@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // GET /api/tickets/{ticketId}/comments
    // List all comments on a ticket (oldest first).
    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(
        @PathVariable String ticketId,
        Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        List<CommentResponse> comments = commentService.getComments(ticketId, user.getId(), user.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Comments fetched", comments));
    }

    // POST /api/tickets/{ticketId}/comments
    // Add a new comment. The user must be the owner, assignee, or an admin.
    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
        @PathVariable String ticketId,
        Authentication authentication,
        @Valid @RequestBody CreateCommentRequest request
    ) {
        User user = (User) authentication.getPrincipal();
        CommentResponse response = commentService.addComment(ticketId, user.getId(), user.getRole(), request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created("Comment added", response));
    }

    // PUT /api/tickets/{ticketId}/comments/{commentId}
    // Edit an existing comment. ONLY the original author can edit.
    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> editComment(
        @PathVariable String ticketId,
        @PathVariable String commentId,
        Authentication authentication,
        @Valid @RequestBody UpdateCommentRequest request
    ) {
        User user = (User) authentication.getPrincipal();
        CommentResponse response = commentService.editComment(ticketId, commentId, user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Comment updated", response));
    }

    // DELETE /api/tickets/{ticketId}/comments/{commentId}
    // The author can delete their own comment. Admin can delete any.
    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
        @PathVariable String ticketId,
        @PathVariable String commentId,
        Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        commentService.deleteComment(ticketId, commentId, user.getId(), user.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Comment deleted", null));
    }
}
