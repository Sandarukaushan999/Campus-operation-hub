package com.campus.modules.users.controller;

import com.campus.common.response.ApiResponse;
import com.campus.domain.User;
import com.campus.modules.users.dto.ChangePasswordRequest;
import com.campus.modules.users.dto.UpdateProfileRequest;
import com.campus.modules.users.dto.UpdateUserRoleRequest;
import com.campus.modules.users.dto.UserResponse;
import com.campus.modules.users.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // -------------------------------------------------------------------------
    // Admin-only operations
    // -------------------------------------------------------------------------

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> listUsers() {
        return ResponseEntity.ok(ApiResponse.ok("Users fetched", userService.listUsers()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody com.campus.modules.users.dto.CreateUserRequest request) {
        return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
            .body(ApiResponse.created("User created successfully", userService.createUser(request)));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
        @PathVariable String id,
        Authentication authentication,
        @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        User actor = (User) authentication.getPrincipal();
        UserResponse updated = userService.updateUserRole(id, actor.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("User role updated", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
        @PathVariable String id,
        Authentication authentication
    ) {
        User actor = (User) authentication.getPrincipal();
        userService.deleteUser(id, actor.getId());
        return ResponseEntity.ok(ApiResponse.ok("User deleted successfully", null));
    }

    // -------------------------------------------------------------------------
    // Profile management - any authenticated user (own data only)
    // -------------------------------------------------------------------------

    // GET /api/users/me - returns the current user's profile
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok("Profile fetched", userService.getProfile(user.getId())));
    }

    // PUT /api/users/me - update name and phone; role is intentionally NOT changeable here
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
        Authentication authentication,
        @Valid @RequestBody UpdateProfileRequest request
    ) {
        User user = (User) authentication.getPrincipal();
        UserResponse updated = userService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", updated));
    }

    // PUT /api/users/change-password - requires old password verification before updating
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
        Authentication authentication,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        User user = (User) authentication.getPrincipal();
        userService.changePassword(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", null));
    }
}
