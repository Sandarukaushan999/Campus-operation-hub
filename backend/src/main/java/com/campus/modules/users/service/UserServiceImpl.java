package com.campus.modules.users.service;

import com.campus.common.enums.UserRole;
import com.campus.common.exception.BadRequestException;
import com.campus.common.exception.ResourceNotFoundException;
import com.campus.domain.User;
import com.campus.modules.users.dto.UpdateUserRoleRequest;
import com.campus.modules.users.dto.UserResponse;
import com.campus.repository.UserRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserResponse> listUsers() {
        return userRepository.findAll()
            .stream()
            .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toResponse)
            .toList();
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

        user.setRole(request.role());
        user.setUpdatedAt(Instant.now());

        return toResponse(userRepository.save(user));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            user.isEnabled(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}

