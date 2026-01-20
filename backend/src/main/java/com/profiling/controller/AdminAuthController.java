package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.AuthResponse;
import com.profiling.dto.LoginRequest;
import com.profiling.exception.UnauthorizedException;
import com.profiling.model.UserRole;
import com.profiling.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminAuthController {

    private final AuthService authService;
    private static final Logger log = LoggerFactory.getLogger(AdminAuthController.class);

    public AdminAuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody LoginRequest request) {
        log.info("Admin login attempt for email={}", request.getEmail());
        AuthResponse authResponse = authService.login(request);
        if (authResponse.getRole() == null || !authResponse.getRole().equalsIgnoreCase(UserRole.ADMIN)) {
            log.warn("Admin login rejected for email={} (not an admin)", request.getEmail());
            throw new UnauthorizedException("Admin credentials required");
        }

        ApiResponse response = new ApiResponse("Admin login successful", authResponse);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }
}








