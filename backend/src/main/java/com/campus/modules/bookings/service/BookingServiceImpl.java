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
import com.campus.modules.bookings.dto.BookingAvailabilityDayResponse;
import com.campus.modules.bookings.dto.BookingAvailabilityResponse;
import com.campus.modules.bookings.dto.BookingResponse;
import com.campus.modules.bookings.dto.CancelBookingRequest;
import com.campus.modules.bookings.dto.CreateBookingRequest;
import com.campus.modules.bookings.dto.RejectBookingRequest;
import com.campus.modules.bookings.dto.TimeSlotResponse;
import com.campus.repository.BookingRepository;
import com.campus.repository.ResourceRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final List<BookingStatus> ACTIVE_BOOKING_STATUSES = List.of(
        BookingStatus.PENDING,
        BookingStatus.APPROVED
    );

    private static final LocalTime SCHEDULER_START_TIME = LocalTime.of(8, 0);
    private static final LocalTime SCHEDULER_END_TIME = LocalTime.of(20, 0);
    private static final int SLOT_MINUTES = 60;
    private static final long MAX_RANGE_DAYS = 90;

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    @Override
    public BookingResponse createBooking(String userId, CreateBookingRequest request) {
        ValidationUtil.validateBookingDate(request.date());
        ValidationUtil.validateBookingTime(request.startTime(), request.endTime());
        ValidationUtil.validateBookingStartNotPast(request.date(), request.startTime());

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

    @Override
    public BookingAvailabilityResponse getAvailability(String resourceId, LocalDate from, LocalDate to) {
        if (resourceId == null || resourceId.isBlank()) {
            throw new BadRequestException("Resource id is required");
        }
        if (from == null || to == null) {
            throw new BadRequestException("From and to dates are required");
        }
        if (to.isBefore(from)) {
            throw new BadRequestException("From date must be before or equal to to date");
        }

        LocalDate normalizedFrom = from.isBefore(LocalDate.now()) ? LocalDate.now() : from;
        long daysBetween = ChronoUnit.DAYS.between(normalizedFrom, to);
        if (daysBetween > MAX_RANGE_DAYS) {
            throw new BadRequestException("Date range is too large. Maximum is 90 days");
        }

        resourceRepository.findById(resourceId)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        List<Booking> bookings = bookingRepository.findByResourceIdAndDateBetweenAndStatusIn(
            resourceId,
            normalizedFrom,
            to,
            ACTIVE_BOOKING_STATUSES
        );

        Map<LocalDate, List<Booking>> bookingsByDate = new HashMap<>();
        for (Booking booking : bookings) {
            bookingsByDate.computeIfAbsent(booking.getDate(), ignored -> new ArrayList<>()).add(booking);
        }

        int totalSlots = calculateTotalSlotsPerDay();
        List<BookingAvailabilityDayResponse> days = new ArrayList<>();

        for (LocalDate date = normalizedFrom; !date.isAfter(to); date = date.plusDays(1)) {
            List<Booking> dateBookings = bookingsByDate.getOrDefault(date, List.of())
                .stream()
                .sorted(Comparator.comparing(Booking::getStartTime))
                .toList();

            List<TimeSlotResponse> availableSlots = calculateAvailableSlots(dateBookings);

            days.add(new BookingAvailabilityDayResponse(
                date,
                totalSlots,
                availableSlots.size(),
                availableSlots
            ));
        }

        return new BookingAvailabilityResponse(resourceId, normalizedFrom, to, days);
    }

    private int calculateTotalSlotsPerDay() {
        int total = 0;
        for (LocalTime slotStart = SCHEDULER_START_TIME;
             !slotStart.plusMinutes(SLOT_MINUTES).isAfter(SCHEDULER_END_TIME);
             slotStart = slotStart.plusMinutes(SLOT_MINUTES)) {
            total++;
        }
        return total;
    }

    private List<TimeSlotResponse> calculateAvailableSlots(List<Booking> dateBookings) {
        List<TimeSlotResponse> availableSlots = new ArrayList<>();

        for (LocalTime slotStart = SCHEDULER_START_TIME;
             !slotStart.plusMinutes(SLOT_MINUTES).isAfter(SCHEDULER_END_TIME);
             slotStart = slotStart.plusMinutes(SLOT_MINUTES)) {
            LocalTime slotEnd = slotStart.plusMinutes(SLOT_MINUTES);
            boolean hasConflict = false;

            for (Booking booking : dateBookings) {
                if (DateTimeUtil.hasOverlap(slotStart, slotEnd, booking.getStartTime(), booking.getEndTime())) {
                    hasConflict = true;
                    break;
                }
            }

            if (!hasConflict) {
                availableSlots.add(new TimeSlotResponse(slotStart, slotEnd));
            }
        }

        return availableSlots;
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

