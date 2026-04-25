package com.campus.repository;

import com.campus.domain.Comment;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

// Mongo queries for ticket comments.
public interface CommentRepository extends MongoRepository<Comment, String> {

    // All comments on a ticket, in the order they were posted (oldest first).
    // Used by GET /api/tickets/{id}/comments
    List<Comment> findByTicketIdOrderByCreatedAtAsc(String ticketId);

    // Wipe every comment that belongs to a ticket.
    // Used when a ticket is hard-deleted so we don't leave orphan comments.
    void deleteByTicketId(String ticketId);
}
