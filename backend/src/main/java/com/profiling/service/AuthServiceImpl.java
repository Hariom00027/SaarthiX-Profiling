package com.profiling.service;

import com.profiling.dto.AuthResponse;
import com.profiling.dto.LoginRequest;
import com.profiling.dto.RegisterRequest;
import com.profiling.exception.BadRequestException;
import com.profiling.exception.DataSaveException;
import com.profiling.exception.DatabaseConnectionException;
import com.profiling.exception.ResourceNotFoundException;
import com.profiling.exception.UnauthorizedException;
import com.profiling.model.User;
import com.profiling.model.UserRole;
import com.profiling.repository.UserRepository;
import com.profiling.security.JwtUtil;
import com.mongodb.MongoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private static final String DEFAULT_ROLE = UserRole.USER;

    @Autowired
    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering user with email={}", request.getEmail());
        if (findByEmailSafe(request.getEmail()).isPresent()) {
            log.warn("Attempt to register existing email={}", request.getEmail());
            throw new BadRequestException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setProvider("local");
        user.setRole(DEFAULT_ROLE);

        User savedUser = saveUser(user);
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getRole());

        log.info("User registered successfully userId={}", savedUser.getId());
        return new AuthResponse(token, savedUser.getId(), savedUser.getEmail(), savedUser.getName(), savedUser.getRole());
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email={}", request.getEmail());
        Optional<User> userOptional = findByEmailSafe(request.getEmail());
        if (userOptional.isEmpty()) {
            log.warn("Login failed for email={}: user not found", request.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }

        User user = userOptional.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed for email={}: invalid password", request.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole(DEFAULT_ROLE);
            user = saveUser(user);
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole());
        log.info("Login successful for userId={}", user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), user.getRole());
    }

    @Override
    public User getCurrentUser(String userId) {
        return findByIdSafe(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    public AuthResponse handleGoogleOAuth(String email, String name, String googleId) {
        log.info("Handling Google OAuth for email={}", email);
        Optional<User> existingUser = findByGoogleIdSafe(googleId);
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            log.info("Existing Google user found userId={}", user.getId());
        } else {
            Optional<User> emailUser = findByEmailSafe(email);
            if (emailUser.isPresent()) {
                user = emailUser.get();
                user.setGoogleId(googleId);
                user.setProvider("google");
                user = saveUser(user);
            } else {
                user = new User();
                user.setEmail(email);
                user.setName(name);
                user.setGoogleId(googleId);
                user.setProvider("google");
                user.setPassword(""); // No password for OAuth users
                user = saveUser(user);
            }
        }

        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole(DEFAULT_ROLE);
            user = saveUser(user);
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole());
        log.info("Google OAuth successful for userId={}", user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), user.getRole());
    }

    @Override
    public AuthResponse handleSomethingXToken(String email, String name, String userType) {
        log.info("Handling SomethingX token exchange for email={}", email);
        Optional<User> existingUser = findByEmailSafe(email);
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            // Update name if provided and different
            if (name != null && !name.isBlank() && !name.equals(user.getName())) {
                user.setName(name);
                user = saveUser(user);
            }
            log.info("Existing user found userId={}", user.getId());
        } else {
            // Create new user for SomethingX
            user = new User();
            user.setEmail(email);
            user.setName(name != null ? name : email);
            user.setProvider("somethingx");
            user.setPassword(""); // No password for SomethingX users
            user = saveUser(user);
            log.info("New user created for SomethingX userId={}", user.getId());
        }

        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole(DEFAULT_ROLE);
            user = saveUser(user);
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole());
        log.info("SomethingX token exchange successful for userId={}", user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), user.getRole());
    }

    private User saveUser(User user) {
        try {
            return userRepository.save(user);
        } catch (DataAccessException | MongoException e) {
            log.error("Database error while saving user: {}", e.getMessage(), e);
            throw new DataSaveException("Failed to save user", e);
        }
    }

    private Optional<User> findByEmailSafe(String email) {
        try {
            return userRepository.findByEmail(email);
        } catch (DataAccessException | MongoException e) {
            log.error("Database error while finding user by email {}: {}", email, e.getMessage(), e);
            throw new DatabaseConnectionException("Failed to fetch user by email", e);
        }
    }

    private Optional<User> findByGoogleIdSafe(String googleId) {
        try {
            return userRepository.findByGoogleId(googleId);
        } catch (DataAccessException | MongoException e) {
            log.error("Database error while finding user by googleId {}: {}", googleId, e.getMessage(), e);
            throw new DatabaseConnectionException("Failed to fetch user by googleId", e);
        }
    }

    private Optional<User> findByIdSafe(String userId) {
        try {
            return userRepository.findById(userId);
        } catch (DataAccessException | MongoException e) {
            log.error("Database error while finding user by id {}: {}", userId, e.getMessage(), e);
            throw new DatabaseConnectionException("Failed to fetch user by id", e);
        }
    }
}


