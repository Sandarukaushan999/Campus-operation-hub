package com.campus.modules.resources.service;

import com.campus.common.enums.ResourceStatus;
import com.campus.common.exception.ResourceNotFoundException;
import com.campus.common.util.ValidationUtil;
import com.campus.domain.Resource;
import com.campus.modules.resources.dto.CreateResourceRequest;
import com.campus.modules.resources.dto.ResourceResponse;
import com.campus.modules.resources.dto.UpdateResourceRequest;
import com.campus.repository.ResourceRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    @Override
    public ResourceResponse create(CreateResourceRequest request) {
        ValidationUtil.validateCapacity(request.capacity());

        Instant now = Instant.now();
        Resource resource = Resource.builder()
            .name(request.name().trim())
            .location(request.location().trim())
            .capacity(request.capacity())
            .status(request.status() == null ? ResourceStatus.AVAILABLE : request.status())
            .createdAt(now)
            .updatedAt(now)
            .build();

        return toResponse(resourceRepository.save(resource));
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

        resource.setUpdatedAt(Instant.now());
        return toResponse(resourceRepository.save(resource));
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

    private ResourceResponse toResponse(Resource resource) {
        return new ResourceResponse(
            resource.getId(),
            resource.getName(),
            resource.getLocation(),
            resource.getCapacity(),
            resource.getStatus(),
            resource.getCreatedAt(),
            resource.getUpdatedAt()
        );
    }
}