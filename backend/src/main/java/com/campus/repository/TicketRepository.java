package com.campus.repository;

import com.campus.common.enums.TicketStatus;
import com.campus.domain.Ticket;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

// Mongo queries for tickets.
//
// Spring Data builds these methods automatically from the method name.
// We just need to follow the naming convention:
//   findBy<Field>OrderBy<Field><Direction>
public interface TicketRepository extends MongoRepository<Ticket, String> {

    // All tickets a specific user reported, newest first.
    // Used by GET /api/tickets/my
    List<Ticket> findByCreatedByOrderByCreatedAtDesc(String userId);

    // All tickets assigned to a specific technician, newest first.
    // Used by GET /api/tickets/assigned
    List<Ticket> findByAssignedToOrderByCreatedAtDesc(String technicianId);

    // All tickets in the system, newest first.
    // Used by GET /api/tickets (admin only)
    List<Ticket> findAllByOrderByCreatedAtDesc();

    // All tickets with a given status, newest first.
    // Used by the admin filter dropdown.
    List<Ticket> findByStatusOrderByCreatedAtDesc(TicketStatus status);
}
