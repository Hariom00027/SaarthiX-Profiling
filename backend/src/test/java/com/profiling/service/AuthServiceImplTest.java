package com.profiling.service;

import com.profiling.dto.AuthResponse;
import com.profiling.dto.LoginRequest;
import com.profiling.dto.RegisterRequest;
import com.profiling.exception.BadRequestException;
import com.profiling.exception.UnauthorizedException;
import com.profiling.model.User;
import com.profiling.model.UserRole;
import com.profiling.repository.UserRepository;
import com.profiling.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthServiceImpl
 * Coverage: Registration, Login, OAuth, User retrieval
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Tests")
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private String testUserId = "user123";
    private String testEmail = "test@example.com";
    private String testPassword = "password123";
    private String testName = "Test User";
    private String testToken = "jwt-token-123";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setEmail(testEmail);
        testUser.setPassword("hashed-password");
        testUser.setName(testName);
        testUser.setRole(UserRole.USER);
        testUser.setProvider("local");
    }

    // TC-AUTH-001: User Registration - Valid Input
    @Test
    @DisplayName("TC-AUTH-001: Register user with valid input should succeed")
    void testRegister_ValidInput_Success() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail(testEmail);
        request.setPassword(testPassword);
        request.setName(testName);

        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(testPassword)).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtUtil.generateToken(anyString(), eq(UserRole.USER))).thenReturn(testToken);

        // Act
        AuthResponse response = authService.register(request);

        // Assert
        assertNotNull(response);
        assertEquals(testToken, response.getToken());
        assertEquals(testUserId, response.getUserId());
        assertEquals(testEmail, response.getEmail());
        assertEquals(testName, response.getName());
        assertEquals(UserRole.USER, response.getRole());

        verify(userRepository).findByEmail(testEmail);
        verify(passwordEncoder).encode(testPassword);
        verify(userRepository).save(any(User.class));
        verify(jwtUtil).generateToken(anyString(), eq(UserRole.USER));
    }

    // TC-AUTH-002: User Registration - Duplicate Email
    @Test
    @DisplayName("TC-AUTH-002: Register with duplicate email should fail")
    void testRegister_DuplicateEmail_ThrowsException() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail(testEmail);
        request.setPassword(testPassword);
        request.setName(testName);

        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            authService.register(request);
        });

        assertEquals("Email already registered", exception.getMessage());
        verify(userRepository).findByEmail(testEmail);
        verify(userRepository, never()).save(any(User.class));
    }

    // TC-AUTH-005: User Login - Valid Credentials
    @Test
    @DisplayName("TC-AUTH-005: Login with valid credentials should succeed")
    void testLogin_ValidCredentials_Success() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail(testEmail);
        request.setPassword(testPassword);

        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(testPassword, testUser.getPassword())).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), eq(UserRole.USER))).thenReturn(testToken);

        // Act
        AuthResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals(testToken, response.getToken());
        assertEquals(testUserId, response.getUserId());
        assertEquals(testEmail, response.getEmail());

        verify(userRepository).findByEmail(testEmail);
        verify(passwordEncoder).matches(testPassword, testUser.getPassword());
        verify(jwtUtil).generateToken(anyString(), eq(UserRole.USER));
    }

    // TC-AUTH-006: User Login - Invalid Email
    @Test
    @DisplayName("TC-AUTH-006: Login with invalid email should fail")
    void testLogin_InvalidEmail_ThrowsException() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@example.com");
        request.setPassword(testPassword);

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () -> {
            authService.login(request);
        });

        assertEquals("Invalid email or password", exception.getMessage());
        verify(userRepository).findByEmail("nonexistent@example.com");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    // TC-AUTH-007: User Login - Invalid Password
    @Test
    @DisplayName("TC-AUTH-007: Login with invalid password should fail")
    void testLogin_InvalidPassword_ThrowsException() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail(testEmail);
        request.setPassword("wrong-password");

        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrong-password", testUser.getPassword())).thenReturn(false);

        // Act & Assert
        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () -> {
            authService.login(request);
        });

        assertEquals("Invalid email or password", exception.getMessage());
        verify(userRepository).findByEmail(testEmail);
        verify(passwordEncoder).matches("wrong-password", testUser.getPassword());
        verify(jwtUtil, never()).generateToken(anyString(), anyString());
    }

    // TC-AUTH-008: Get Current User - Valid User
    @Test
    @DisplayName("TC-AUTH-008: Get current user with valid ID should succeed")
    void testGetCurrentUser_ValidId_Success() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // Act
        User user = authService.getCurrentUser(testUserId);

        // Assert
        assertNotNull(user);
        assertEquals(testUserId, user.getId());
        assertEquals(testEmail, user.getEmail());
        verify(userRepository).findById(testUserId);
    }

    // TC-AUTH-009: Get Current User - Invalid User
    @Test
    @DisplayName("TC-AUTH-009: Get current user with invalid ID should fail")
    void testGetCurrentUser_InvalidId_ThrowsException() {
        // Arrange
        when(userRepository.findById("invalid-id")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(com.profiling.exception.ResourceNotFoundException.class, () -> {
            authService.getCurrentUser("invalid-id");
        });

        verify(userRepository).findById("invalid-id");
    }

    // Additional edge cases
    @Test
    @DisplayName("Login with null role should set default role")
    void testLogin_NullRole_SetsDefaultRole() {
        // Arrange
        testUser.setRole(null);
        LoginRequest request = new LoginRequest();
        request.setEmail(testEmail);
        request.setPassword(testPassword);

        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(testPassword, testUser.getPassword())).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtUtil.generateToken(anyString(), eq(UserRole.USER))).thenReturn(testToken);

        // Act
        AuthResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        verify(userRepository).save(any(User.class));
        verify(jwtUtil).generateToken(anyString(), eq(UserRole.USER));
    }
}

