package com.campus.modules.bookings.service;

import com.campus.common.enums.BookingStatus;
import com.campus.common.enums.ResourceStatus;
import com.campus.common.enums.UserRole;
import com.campus.common.exception.BadRequestException;
import com.campus.common.exception.ConflictException;
import com.campus.common.exception.ResourceNotFoundException;
import com.campus.common.util.DateTimeUtil;
import com.campus.common.util.ValidationUtil;
import com.campus.domain.Booking;
import com.campus.domain.Resource;
import com.campus.modules.bookings.dto.ApproveBookingRequest;
import com.campus.modules.bookings.dto.BookingResponse;
import com.campus.modules.bookings.dto.CancelBookingRequest;
import com.campus.modules.bookings.dto.CreateBookingRequest;
import com.campus.modules.bookings.dto.RejectBookingRequest;
import com.campus.repository.BookingRepository;
import com.campus.repository.ResourceRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final List<BookingStatus> ACTIVE_BOOKING_STATUSES = List.of(
        BookingStatus.PENDING,
        BookingStatus.APPROVED
    );

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    @Override
    public BookingResponse createBooking(String userId, CreateBookingRequest request) {
        ValidationUtil.validateBookingDate(request.date());
        ValidationUtil.validateBookingTime(request.startTime(), request.endTime());

        Resource resource = resourceRepository.findById(request.resourceId())
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (resource.getStatus() != ResourceStatus.AVAILABLE) {
            throw new ConflictException("Resource is not available for booking");
        }

        List<Booking> existingBookings = bookingRepository.findByResourceIdAndDateAndStatusIn(
            request.resourceId(),
            request.date(),
            ACTIVE_BOOKING_STATUSES
        );

        for (Booking existing : existingBookings) {
            if (DateTimeUtil.hasOverlap(
                request.startTime(),
                request.endTime(),
                existing.getStartTime(),
                existing.getEndTime()
            )) {
                throw new ConflictException("Booking conflict detected");
            }
        }

        Instant now = Instant.now();
        Booking booking = Booking.builder()
            .resourceId(request.resourceId())
            .userId(userId)
            .title(request.title().trim())
            .purpose(request.purpose() == null ? null : request.purpose().trim())
            .date(request.date())
            .startTime(request.startTime())
            .endTime(request.endTime())
            .status(BookingStatus.PENDING)
            .createdAt(now)
            .updatedAt(now)
            .build();

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllByOrderByDateDescStartTimeAsc()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    public List<BookingResponse> getMyBookings(String userId) {
        return bookingRepository.findByUserIdOrderByDateDescStartTimeAsc(userId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    public BookingResponse getBookingById(String bookingId, String actorId, UserRole actorRole) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (actorRole != UserRole.ADMIN && !booking.getUserId().equals(actorId)) {
            throw new BadRequestException("You are not allowed to view this booking");
        }

        return toResponse(booking);
    }

    @Override
    public BookingResponse approveBooking(String bookingId, String approverId, ApproveBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ConflictException("Only pending bookings can be approved");
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setApproverId(approverId);
        booking.setUpdatedAt(Instant.now());

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    public BookingResponse rejectBooking(String bookingId, String approverId, RejectBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ConflictException("Only pending bookings can be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(request.reason().trim());
        booking.setApproverId(approverId);
        booking.setUpdatedAt(Instant.now());

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    public BookingResponse cancelBooking(String bookingId, String actorId, UserRole actorRole, CancelBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        boolean isAdmin = actorRole == UserRole.ADMIN;
        boolean isOwner = booking.getUserId().equals(actorId);

        if (!isAdmin && !isOwner) {
            throw new BadRequestException("You can only cancel your own booking");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setRejectionReason(request.reason() == null ? booking.getRejectionReason() : request.reason().trim());
        booking.setUpdatedAt(Instant.now());

        return toResponse(bookingRepository.save(booking));
    }

    private BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
            booking.getId(),
            booking.getResourceId(),
            booking.getUserId(),
            booking.getTitle(),
            booking.getPurpose(),
            booking.getDate(),
            booking.getStartTime(),
            booking.getEndTime(),
            booking.getStatus(),
            booking.getRejectionReason(),
            booking.getApproverId(),
            booking.getCreatedAt(),
            booking.getUpdatedAt()
        );
    }
}