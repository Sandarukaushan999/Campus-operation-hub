package com.campus.modules.resources.service;

import com.campus.common.enums.ResourceStatus;
import com.campus.common.exception.ResourceNotFoundException;
import com.campus.common.util.ValidationUtil;
import com.campus.domain.Resource;
import com.campus.modules.resources.dto.CreateResourceRequest;
import com.campus.modules.resources.dto.ResourceResponse;
import com.campus.modules.resources.dto.UpdateResourceRequest;
import com.campus.modules.tickets.notify.NotificationPublisher;
import com.campus.repository.ResourceRepository;
import com.campus.repository.UserRepository;
import com.campus.domain.User;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationPublisher notificationPublisher;

    @Override
    public ResourceResponse create(CreateResourceRequest request) {
        ValidationUtil.validateCapacity(request.capacity());

        Instant now = Instant.now();
        Resource resource = Resource.builder()
            .name(request.name().trim())
            .location(request.location().trim())
            .capacity(request.capacity())
            .status(request.status() == null ? ResourceStatus.AVAILABLE : request.status())
            .availableDate(request.availableDate())
            .startTime(request.startTime())
            .endTime(request.endTime())
            .createdAt(now)
            .updatedAt(now)
            .build();

        Resource saved = resourceRepository.save(resource);

        // Notify all users about the new resource
        List<User> users = userRepository.findAll();
        for (User user : users) {
            notificationPublisher.notify(
                user.getId(),
                "RESOURCE_ADDED",
                "New Resource Added",
                "A new resource '" + saved.getName() + "' is now available at " + saved.getLocation() + "."
            );
        }

        return toResponse(saved);
    }

    @Override
    public ResourceResponse update(String id, UpdateResourceRequest request) {
        Resource resource = resourceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (request.name() != null && !request.name().isBlank()) {
            resource.setName(request.name().trim());
        }

        if (request.location() != null && !request.location().isBlank()) {
            resource.setLocation(request.location().trim());
        }

        if (request.capacity() != null) {
            ValidationUtil.validateCapacity(request.capacity());
            resource.setCapacity(request.capacity());
        }

        if (request.status() != null) {
            resource.setStatus(request.status());
        }

        if (request.availableDate() != null) {
            resource.setAvailableDate(request.availableDate());
        }

        if (request.startTime() != null) {
            resource.setStartTime(request.startTime());
        }

        if (request.endTime() != null) {
            resource.setEndTime(request.endTime());
        }

        resource.setUpdatedAt(Instant.now());
        Resource saved = resourceRepository.save(resource);

        // Notify all users about the updated resource
        List<User> users = userRepository.findAll();
        for (User user : users) {
            notificationPublisher.notify(
                user.getId(),
                "RESOURCE_UPDATED",
                "Resource Updated",
                "The resource '" + saved.getName() + "' has been updated."
            );
        }

        return toResponse(saved);
    }

    @Override
    public List<ResourceResponse> findAll() {
        return resourceRepository.findAll()
            .stream()
            .sorted(Comparator.comparing(Resource::getName, String.CASE_INSENSITIVE_ORDER))
            .map(this::toResponse)
            .toList();
    }

    @Override
    public ResourceResponse findById(String id) {
        Resource resource = resourceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        return toResponse(resource);
    }

    @Override
    public void delete(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found");
        }
        resourceRepository.deleteById(id);
    }

    private ResourceResponse toResponse(Resource resource) {
        return new ResourceResponse(
            resource.getId(),
            resource.getName(),
            resource.getLocation(),
            resource.getCapacity(),
            resource.getStatus(),
            resource.getAvailableDate(),
            resource.getStartTime(),
            resource.getEndTime(),
            resource.getCreatedAt(),
            resource.getUpdatedAt()
        );
    }
}