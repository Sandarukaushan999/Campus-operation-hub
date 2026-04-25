package com.campus.common.response;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
    int status,
    String error,
    String message,
    String path,
    List<String> details,
    Instant timestamp
) {
}