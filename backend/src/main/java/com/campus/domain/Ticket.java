package com.campus.domain;

import com.campus.common.enums.TicketStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    private String title;

    private String description;

    private String createdBy;

    private String assignedTo;

    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    private Instant createdAt;

    private Instant updatedAt;
}