package com.campus.modules.resources.service;

import com.campus.modules.resources.dto.CreateResourceRequest;
import com.campus.modules.resources.dto.ResourceResponse;
import com.campus.modules.resources.dto.UpdateResourceRequest;
import java.util.List;

public interface ResourceService {

    ResourceResponse create(CreateResourceRequest request);

    ResourceResponse update(String id, UpdateResourceRequest request);

    List<ResourceResponse> findAll();

    ResourceResponse findById(String id);

    void delete(String id);
}