package com.campus.repository;

import com.campus.common.enums.BookingStatus;
import com.campus.domain.Booking;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByResourceIdAndDate(String resourceId, LocalDate date);

    List<Booking> findByResourceIdAndDateAndStatusIn(String resourceId, LocalDate date, List<BookingStatus> statuses);

    List<Booking> findByUserIdOrderByDateDescStartTimeAsc(String userId);

    List<Booking> findAllByOrderByDateDescStartTimeAsc();
}