package com.profiling.service;

import com.profiling.dto.AuthResponse;
import com.profiling.dto.LoginRequest;
import com.profiling.dto.RegisterRequest;
import com.profiling.model.User;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    User getCurrentUser(String userId);
    AuthResponse handleGoogleOAuth(String email, String name, String googleId);
    AuthResponse handleSomethingXToken(String email, String name, String userType);
}

