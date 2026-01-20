package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.AuthResponse;
import com.profiling.dto.LoginRequest;
import com.profiling.exception.UnauthorizedException;
import com.profiling.model.UserRole;
import com.profiling.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminAuthController Tests")
class AdminAuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AdminAuthController controller;

    private LoginRequest validLoginRequest;
    private AuthResponse adminAuthResponse;
    private AuthResponse userAuthResponse;

    @BeforeEach
    void setUp() {
        validLoginRequest = new LoginRequest();
        validLoginRequest.setEmail("admin@example.com");
        validLoginRequest.setPassword("admin123");

        adminAuthResponse = new AuthResponse();
        adminAuthResponse.setToken("admin-token");
        adminAuthResponse.setUserId("admin-123");
        adminAuthResponse.setEmail("admin@example.com");
        adminAuthResponse.setRole(UserRole.ADMIN.toString());

        userAuthResponse = new AuthResponse();
        userAuthResponse.setToken("user-token");
        userAuthResponse.setUserId("user-123");
        userAuthResponse.setEmail("user@example.com");
        userAuthResponse.setRole(UserRole.USER.toString());
    }

    @Test
    @DisplayName("login should succeed for admin user")
    void testLogin_AdminUser_ReturnsSuccess() {
        when(authService.login(any(LoginRequest.class))).thenReturn(adminAuthResponse);

        ResponseEntity<ApiResponse> response = controller.login(validLoginRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Admin login successful", response.getBody().getMessage());
        verify(authService).login(validLoginRequest);
    }

    @Test
    @DisplayName("login should reject non-admin user")
    void testLogin_NonAdminUser_ThrowsUnauthorizedException() {
        when(authService.login(any(LoginRequest.class))).thenReturn(userAuthResponse);

        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () -> {
            controller.login(validLoginRequest);
        });

        assertEquals("Admin credentials required", exception.getMessage());
        verify(authService).login(validLoginRequest);
    }

    @Test
    @DisplayName("login should reject user with null role")
    void testLogin_NullRole_ThrowsUnauthorizedException() {
        adminAuthResponse.setRole(null);
        when(authService.login(any(LoginRequest.class))).thenReturn(adminAuthResponse);

        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () -> {
            controller.login(validLoginRequest);
        });

        assertEquals("Admin credentials required", exception.getMessage());
    }

    @Test
    @DisplayName("login should handle invalid credentials")
    void testLogin_InvalidCredentials_ThrowsException() {
        when(authService.login(any(LoginRequest.class)))
            .thenThrow(new UnauthorizedException("Invalid credentials"));

        assertThrows(UnauthorizedException.class, () -> {
            controller.login(validLoginRequest);
        });
    }

    @Test
    @DisplayName("login should handle null email")
    void testLogin_NullEmail_HandlesGracefully() {
        validLoginRequest.setEmail(null);
        when(authService.login(any(LoginRequest.class)))
            .thenThrow(new IllegalArgumentException("Email is required"));

        assertThrows(IllegalArgumentException.class, () -> {
            controller.login(validLoginRequest);
        });
    }

    @Test
    @DisplayName("login should handle empty password")
    void testLogin_EmptyPassword_HandlesGracefully() {
        validLoginRequest.setPassword("");
        when(authService.login(any(LoginRequest.class)))
            .thenThrow(new IllegalArgumentException("Password is required"));

        assertThrows(IllegalArgumentException.class, () -> {
            controller.login(validLoginRequest);
        });
    }
}
