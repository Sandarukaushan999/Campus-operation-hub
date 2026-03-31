package com.campus.modules.auth.service;

import com.campus.modules.auth.dto.AuthResponse;
import com.campus.modules.auth.dto.LoginRequest;
import com.campus.modules.auth.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}