package com.campus.domain;

import com.campus.common.enums.BookingStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
@CompoundIndex(name = "resource_date_idx", def = "{'resourceId': 1, 'date': 1}")
public class Booking {

    @Id
    private String id;

    private String resourceId;

    private String userId;

    private String title;

    private String purpose;

    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    private String rejectionReason;

    private String approverId;

    private Instant createdAt;

    private Instant updatedAt;
}