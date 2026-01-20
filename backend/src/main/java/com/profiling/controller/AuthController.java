package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.AuthResponse;
import com.profiling.dto.LoginRequest;
import com.profiling.dto.RegisterRequest;
import com.profiling.dto.UserResponse;
import com.profiling.exception.UnauthorizedException;
import com.profiling.model.User;
import com.profiling.security.JwtUtil;
import com.profiling.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Value("${app.frontend.url:http://localhost:4000}")
    private String frontendUrl;

    @Autowired
    public AuthController(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterRequest request) {
        log.info("Registering user with email={}", request.getEmail());
        AuthResponse authResponse = authService.register(request);
        log.info("User registered successfully userId={}", authResponse.getUserId());
        ApiResponse response = new ApiResponse("Registration successful", authResponse);
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody LoginRequest request) {
        log.info("Login attempt for email={}", request.getEmail());
        AuthResponse authResponse = authService.login(request);
        log.info("Login successful for userId={}", authResponse.getUserId());
        ApiResponse response = new ApiResponse("Login successful", authResponse);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse> getCurrentUser(HttpServletRequest request) {
        String token = extractTokenFromRequest(request);
        if (token == null || !jwtUtil.validateToken(token)) {
            log.warn("Invalid or missing token while fetching current user");
            throw new UnauthorizedException("Invalid authentication token");
        }

        String userId = jwtUtil.extractUserId(token);
        User user = authService.getCurrentUser(userId);
        UserResponse userResponse = new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getProvider(), user.getRole());
        log.info("Fetched current user details for userId={}", userId);
        
        ApiResponse response = new ApiResponse("User retrieved successfully", userResponse);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @GetMapping("/google/callback")
    public ResponseEntity<?> googleCallback(@AuthenticationPrincipal OAuth2User oauth2User) {
        if (oauth2User == null) {
            log.warn("Google OAuth callback without user principal");
            // Redirect to frontend root with error - frontend will handle it
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", frontendUrl + "/?error=oauth_failed")
                    .build();
        }

        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String googleId = oauth2User.getAttribute("sub");

        if (email == null || googleId == null) {
            log.warn("Google OAuth missing required attributes");
            // Redirect to frontend root with error - frontend will handle it
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", frontendUrl + "/?error=oauth_failed")
                    .build();
        }

        try {
            AuthResponse authResponse = authService.handleGoogleOAuth(email, name != null ? name : email, googleId);
            log.info("Google OAuth successful for email={}", email);
            
            // Redirect to frontend root with token in query parameter
            String redirectUrl = frontendUrl + "/?token=" + authResponse.getToken();
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", redirectUrl)
                    .build();
        } catch (Exception e) {
            log.error("Error handling Google OAuth for email={}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", frontendUrl + "/?error=oauth_failed")
                    .build();
        }
    }

    @PostMapping("/somethingx/exchange")
    public ResponseEntity<ApiResponse> exchangeSomethingXToken(
            @RequestParam(required = false) String token,
            @RequestParam String email,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String userType) {
        log.info("SomethingX token exchange request for email={}", email);
        
        if (email == null || email.isBlank()) {
            log.warn("SomethingX token exchange failed: email is required");
            ApiResponse response = new ApiResponse("Email is required", null);
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // Note: We trust the email/name/userType from SomethingX since it's coming from an authenticated session
            // The token parameter is kept for future validation if needed
            AuthResponse authResponse = authService.handleSomethingXToken(
                email, 
                name != null ? name : email, 
                userType != null ? userType : "STUDENT"
            );
            
            log.info("SomethingX token exchange successful for email={}", email);
            ApiResponse response = new ApiResponse("Token exchange successful", authResponse);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            log.error("Error handling SomethingX token exchange for email={}: {}", email, e.getMessage(), e);
            ApiResponse response = new ApiResponse("Token exchange failed: " + e.getMessage(), null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

