package com.campus.modules.resources.controller;

import com.campus.common.response.ApiResponse;
import com.campus.modules.resources.dto.CreateResourceRequest;
import com.campus.modules.resources.dto.ResourceResponse;
import com.campus.modules.resources.dto.UpdateResourceRequest;
import com.campus.modules.resources.service.ResourceService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResourceResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Resources fetched", resourceService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok("Resource fetched", resourceService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResourceResponse>> create(@Valid @RequestBody CreateResourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created("Resource created", resourceService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResourceResponse>> update(
        @PathVariable String id,
        @Valid @RequestBody UpdateResourceRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Resource updated", resourceService.update(id, request)));
    }
}