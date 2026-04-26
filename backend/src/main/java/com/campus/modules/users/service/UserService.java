package com.campus.modules.users.service;

import com.campus.modules.users.dto.ChangePasswordRequest;
import com.campus.modules.users.dto.UpdateProfileRequest;
import com.campus.modules.users.dto.UpdateUserRoleRequest;
import com.campus.modules.users.dto.UserResponse;
import java.util.List;

public interface UserService {

    List<UserResponse> listUsers();

    UserResponse createUser(com.campus.modules.users.dto.CreateUserRequest request);

    UserResponse updateUserRole(String targetUserId, String actorUserId, UpdateUserRoleRequest request);

    void deleteUser(String targetUserId, String actorUserId);

    // Profile management - any authenticated user
    UserResponse getProfile(String userId);

    UserResponse updateProfile(String userId, UpdateProfileRequest request);

    void changePassword(String userId, ChangePasswordRequest request);
}

