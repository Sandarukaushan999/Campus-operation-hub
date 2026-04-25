package com.campus.modules.users.service;

import com.campus.modules.users.dto.UpdateUserRoleRequest;
import com.campus.modules.users.dto.UserResponse;
import java.util.List;

public interface UserService {

    List<UserResponse> listUsers();

    UserResponse updateUserRole(String targetUserId, String actorUserId, UpdateUserRoleRequest request);
}

