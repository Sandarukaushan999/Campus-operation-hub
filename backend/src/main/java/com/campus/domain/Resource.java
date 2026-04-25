package com.campus.domain;

import com.campus.common.enums.ResourceStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resources")
public class Resource {

    @Id
    private String id;

    private String name;

    private String location;

    private Integer capacity;

    @Builder.Default
    private ResourceStatus status = ResourceStatus.AVAILABLE;

    private Instant createdAt;

    private Instant updatedAt;
}