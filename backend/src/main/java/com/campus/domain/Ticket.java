package com.campus.domain;

import com.campus.common.enums.TicketCategory;
import com.campus.common.enums.TicketPriority;
import com.campus.common.enums.TicketStatus;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

// A maintenance / incident ticket reported by a user.
//
// Either resourceId OR location must be filled in. The service layer
// checks this when a ticket is created. We do not enforce it at the
// schema level so that legacy tickets are still readable.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    // Where the problem is. The user gives ONE of these two:
    private String resourceId;        // points to a Resource document, e.g. a projector
    private String location;          // free text like "Block A, Room 12"

    // What the problem is
    private String title;             // short summary
    private String description;       // full details from the user

    private TicketCategory category;  // ELECTRICAL / NETWORK / FURNITURE / IT_EQUIPMENT / PLUMBING / OTHER
    private TicketPriority priority;  // LOW / MEDIUM / HIGH / URGENT

    // How the technician can reach the reporter (phone or email)
    private String contactDetails;

    // File names of uploaded image evidence (max 3, validated in the service).
    // The actual files live on disk - this list only stores the safe filenames.
    @Builder.Default
    private List<String> attachments = new ArrayList<>();

    // Who reported it (user id from JWT)
    private String createdBy;

    // Which technician is working on it (null until an admin assigns one)
    private String assignedTo;

    // Workflow state - default OPEN when a new ticket is created
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    // Filled in when the technician marks the ticket as RESOLVED
    private String resolutionNotes;

    // Filled in when an admin marks the ticket as REJECTED
    private String rejectionReason;

    // Audit timestamps - set to Instant.now() in the service
    private Instant createdAt;
    private Instant updatedAt;
}
