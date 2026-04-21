package com.campus.modules.users.controller;

import com.campus.common.response.ApiResponse;
import com.campus.domain.User;
import com.campus.modules.users.dto.UpdateUserRoleRequest;
import com.campus.modules.users.dto.UserResponse;
import com.campus.modules.users.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> listUsers() {
        return ResponseEntity.ok(ApiResponse.ok("Users fetched", userService.listUsers()));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
        @PathVariable String id,
        Authentication authentication,
        @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        User actor = (User) authentication.getPrincipal();
        UserResponse updated = userService.updateUserRole(id, actor.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("User role updated", updated));
    }
}

