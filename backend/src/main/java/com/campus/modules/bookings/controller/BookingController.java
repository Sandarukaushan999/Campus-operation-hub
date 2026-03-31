package com.campus.modules.bookings.controller;

import com.campus.common.response.ApiResponse;
import com.campus.domain.User;
import com.campus.modules.bookings.dto.ApproveBookingRequest;
import com.campus.modules.bookings.dto.BookingResponse;
import com.campus.modules.bookings.dto.CancelBookingRequest;
import com.campus.modules.bookings.dto.CreateBookingRequest;
import com.campus.modules.bookings.dto.RejectBookingRequest;
import com.campus.modules.bookings.service.BookingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> create(
        Authentication authentication,
        @Valid @RequestBody CreateBookingRequest request
    ) {
        User user = (User) authentication.getPrincipal();
        BookingResponse response = bookingService.createBooking(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created("Booking created", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Bookings fetched", bookingService.getAllBookings()));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok("My bookings fetched", bookingService.getMyBookings(user.getId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getById(@PathVariable String id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        BookingResponse response = bookingService.getBookingById(id, user.getId(), user.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Booking fetched", response));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponse>> approve(
        @PathVariable String id,
        Authentication authentication,
        @RequestBody(required = false) ApproveBookingRequest request
    ) {
        User user = (User) authentication.getPrincipal();
        ApproveBookingRequest safeRequest = request == null ? new ApproveBookingRequest(null) : request;
        BookingResponse response = bookingService.approveBooking(id, user.getId(), safeRequest);
        return ResponseEntity.ok(ApiResponse.ok("Booking approved", response));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponse>> reject(
        @PathVariable String id,
        Authentication authentication,
        @Valid @RequestBody RejectBookingRequest request
    ) {
        User user = (User) authentication.getPrincipal();
        BookingResponse response = bookingService.rejectBooking(id, user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Booking rejected", response));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancel(
        @PathVariable String id,
        Authentication authentication,
        @RequestBody(required = false) CancelBookingRequest request
    ) {
        User user = (User) authentication.getPrincipal();
        CancelBookingRequest safeRequest = request == null ? new CancelBookingRequest(null) : request;
        BookingResponse response = bookingService.cancelBooking(id, user.getId(), user.getRole(), safeRequest);
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled", response));
    }
}