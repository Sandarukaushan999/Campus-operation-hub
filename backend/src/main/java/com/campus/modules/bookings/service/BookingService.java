package com.campus.modules.bookings.service;

import com.campus.common.enums.UserRole;
import com.campus.modules.bookings.dto.ApproveBookingRequest;
import com.campus.modules.bookings.dto.BookingResponse;
import com.campus.modules.bookings.dto.CancelBookingRequest;
import com.campus.modules.bookings.dto.CreateBookingRequest;
import com.campus.modules.bookings.dto.RejectBookingRequest;
import java.util.List;

public interface BookingService {

    BookingResponse createBooking(String userId, CreateBookingRequest request);

    List<BookingResponse> getAllBookings();

    List<BookingResponse> getMyBookings(String userId);

    BookingResponse getBookingById(String bookingId, String actorId, UserRole actorRole);

    BookingResponse approveBooking(String bookingId, String approverId, ApproveBookingRequest request);

    BookingResponse rejectBooking(String bookingId, String approverId, RejectBookingRequest request);

    BookingResponse cancelBooking(String bookingId, String actorId, UserRole actorRole, CancelBookingRequest request);
}