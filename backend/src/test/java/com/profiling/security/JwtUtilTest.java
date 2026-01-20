package com.profiling.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtUtil Tests")
class JwtUtilTest {

    private JwtUtil jwtUtil;
    private static final String TEST_SECRET = "testSecretKeyThatIsLongEnoughForHS256Algorithm123456";
    private static final Long TEST_EXPIRATION = 86400000L; // 24 hours

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiration", TEST_EXPIRATION);
    }

    @Test
    @DisplayName("generateToken should create valid token")
    void testGenerateToken_ValidInput_CreatesToken() {
        String token = jwtUtil.generateToken("user-123", "USER");
        
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    @DisplayName("generateToken should create token without role")
    void testGenerateToken_NoRole_CreatesToken() {
        String token = jwtUtil.generateToken("user-123");
        
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    @DisplayName("extractUserId should extract correct user ID")
    void testExtractUserId_ValidToken_ReturnsUserId() {
        String token = jwtUtil.generateToken("user-123", "USER");
        String userId = jwtUtil.extractUserId(token);
        
        assertEquals("user-123", userId);
    }

    @Test
    @DisplayName("validateToken should return true for valid token")
    void testValidateToken_ValidToken_ReturnsTrue() {
        String token = jwtUtil.generateToken("user-123", "USER");
        boolean isValid = jwtUtil.validateToken(token, "user-123");
        
        assertTrue(isValid);
    }

    @Test
    @DisplayName("validateToken should return false for wrong user ID")
    void testValidateToken_WrongUserId_ReturnsFalse() {
        String token = jwtUtil.generateToken("user-123", "USER");
        boolean isValid = jwtUtil.validateToken(token, "user-456");
        
        assertFalse(isValid);
    }

    @Test
    @DisplayName("validateToken should return false for invalid token")
    void testValidateToken_InvalidToken_ReturnsFalse() {
        boolean isValid = jwtUtil.validateToken("invalid.token.here");
        
        assertFalse(isValid);
    }

    @Test
    @DisplayName("validateToken should return false for null token")
    void testValidateToken_NullToken_ReturnsFalse() {
        boolean isValid = jwtUtil.validateToken((String) null);
        
        assertFalse(isValid);
    }

    @Test
    @DisplayName("extractExpiration should return future date")
    void testExtractExpiration_ValidToken_ReturnsFutureDate() {
        String token = jwtUtil.generateToken("user-123", "USER");
        Date expiration = jwtUtil.extractExpiration(token);
        
        assertNotNull(expiration);
        assertTrue(expiration.after(new Date()));
    }
}
