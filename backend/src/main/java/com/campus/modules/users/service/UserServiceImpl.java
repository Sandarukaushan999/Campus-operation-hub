package com.campus.modules.users.service;

import com.campus.common.enums.UserRole;
import com.campus.common.exception.BadRequestException;
import com.campus.common.exception.ResourceNotFoundException;
import com.campus.domain.User;
import com.campus.modules.users.dto.ChangePasswordRequest;
import com.campus.modules.users.dto.UpdateProfileRequest;
import com.campus.modules.users.dto.UpdateUserRoleRequest;
import com.campus.modules.users.dto.UserResponse;
import com.campus.modules.tickets.notify.NotificationPublisher;
import com.campus.repository.UserRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationPublisher notificationPublisher;

    // -------------------------------------------------------------------------
    // Admin operations
    // -------------------------------------------------------------------------

    @Override
    public List<UserResponse> listUsers() {
        return userRepository.findAll()
            .stream()
            .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toResponse)
            .toList();
    }

    @Override
    public UserResponse createUser(com.campus.modules.users.dto.CreateUserRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new com.campus.common.exception.ConflictException("Email is already registered");
        }

        Instant now = Instant.now();
        User user = User.builder()
            .fullName(request.fullName().trim())
            .email(normalizedEmail)
            .password(passwordEncoder.encode(request.password()))
            .role(request.role() != null ? request.role() : UserRole.USER)
            .enabled(true)
            .createdAt(now)
            .updatedAt(now)
            .build();

        return toResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateUserRole(String targetUserId, String actorUserId, UpdateUserRoleRequest request) {
        if (targetUserId == null || targetUserId.isBlank()) {
            throw new BadRequestException("User id is required");
        }
        if (request == null || request.role() == null) {
            throw new BadRequestException("Role is required");
        }
        if (targetUserId.equals(actorUserId) && request.role() != UserRole.ADMIN) {
            throw new BadRequestException("You cannot remove your own admin role");
        }

        User user = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserRole from = user.getRole();
        UserRole to = request.role();

        user.setRole(request.role());
        user.setUpdatedAt(Instant.now());

        User saved = userRepository.save(user);

        // Notify the user that their role changed (simple in-app notification).
        if (from != to) {
            notificationPublisher.notify(
                saved.getId(),
                "USER_ROLE_CHANGED",
                "Your role was updated",
                "Your account role changed from " + from.name() + " to " + to.name()
            );
        }

        return toResponse(saved);
    }

    @Override
    public void deleteUser(String targetUserId, String actorUserId) {
        if (targetUserId == null || targetUserId.isBlank()) {
            throw new BadRequestException("User id is required");
        }
        if (targetUserId.equals(actorUserId)) {
            throw new BadRequestException("You cannot delete your own account");
        }

        if (!userRepository.existsById(targetUserId)) {
            throw new ResourceNotFoundException("User not found");
        }

        userRepository.deleteById(targetUserId);
    }

    // -------------------------------------------------------------------------
    // Profile management (any authenticated user, own data only)
    // -------------------------------------------------------------------------

    @Override
    public UserResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toResponse(user);
    }

    @Override
    public UserResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Role is intentionally NOT touched here
        user.setFullName(request.fullName().trim());

        String phone = request.phone();
        user.setPhone(phone == null ? null : phone.trim());

        user.setUpdatedAt(Instant.now());

        return toResponse(userRepository.save(user));
    }

    @Override
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Verify the user knows their current password before allowing a change
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new BadRequestException("Old password is incorrect");
        }

        if (request.oldPassword().equals(request.newPassword())) {
            throw new BadRequestException("New password must be different from the old password");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    // -------------------------------------------------------------------------
    // Mapper - password is never included (field is @JsonIgnore on entity anyway)
    // -------------------------------------------------------------------------

    private UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getFullName(),
            user.getPhone(),
            user.getEmail(),
            user.getRole(),
            user.isEnabled(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
