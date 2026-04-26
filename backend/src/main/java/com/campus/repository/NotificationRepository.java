package com.campus.repository;

import com.campus.domain.Notification;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    long countByUserIdAndReadFalse(String userId);

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
}