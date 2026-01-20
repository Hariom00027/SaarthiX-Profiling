package com.profiling.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ResponseStatusException;

import com.mongodb.MongoException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalExceptionHandler Tests")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @Mock
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        when(request.getRequestURI()).thenReturn("/api/test");
    }

    @Test
    @DisplayName("handleIllegalArgumentException should return BAD_REQUEST")
    void testHandleIllegalArgumentException_ReturnsBadRequest() {
        IllegalArgumentException ex = new IllegalArgumentException("Invalid argument");
        
        ResponseEntity<Map<String, Object>> response = handler.handleIllegalArgumentException(ex, request);
        
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("IllegalArgumentException", response.getBody().get("error"));
    }

    @Test
    @DisplayName("handleMongoException should return SERVICE_UNAVAILABLE")
    void testHandleMongoException_ReturnsServiceUnavailable() {
        MongoException ex = new MongoException("Database error");
        
        ResponseEntity<Map<String, Object>> response = handler.handleMongoException(ex, request);
        
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertEquals("DatabaseError", response.getBody().get("error"));
    }

    @Test
    @DisplayName("handleDataAccessException should return SERVICE_UNAVAILABLE")
    void testHandleDataAccessException_ReturnsServiceUnavailable() {
        DataAccessException ex = mock(DataAccessException.class);
        when(ex.getMessage()).thenReturn("Database access failed");
        
        ResponseEntity<Map<String, Object>> response = handler.handleDataAccessException(ex, request);
        
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertEquals("DatabaseError", response.getBody().get("error"));
    }

    @Test
    @DisplayName("handleBadRequestException should return BAD_REQUEST")
    void testHandleBadRequestException_ReturnsBadRequest() {
        BadRequestException ex = new BadRequestException("Bad request");
        
        ResponseEntity<Map<String, Object>> response = handler.handleCustomExceptions(ex, request);
        
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Bad request", response.getBody().get("message"));
    }

    @Test
    @DisplayName("handleUnauthorizedException should return UNAUTHORIZED")
    void testHandleUnauthorizedException_ReturnsUnauthorized() {
        UnauthorizedException ex = new UnauthorizedException("Unauthorized");
        
        ResponseEntity<Map<String, Object>> response = handler.handleCustomExceptions(ex, request);
        
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("handleNotFoundException should return NOT_FOUND")
    void testHandleNotFoundException_ReturnsNotFound() {
        NotFoundException ex = new NotFoundException("Not found");
        
        ResponseEntity<Map<String, Object>> response = handler.handleCustomExceptions(ex, request);
        
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("handleGenericException should return INTERNAL_SERVER_ERROR")
    void testHandleGenericException_ReturnsInternalServerError() {
        RuntimeException ex = new RuntimeException("Unexpected error");
        
        ResponseEntity<Map<String, Object>> response = handler.handleGenericException(ex, request);
        
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("InternalServerError", response.getBody().get("error"));
    }

    @Test
    @DisplayName("handleResponseStatusException should return correct status")
    void testHandleResponseStatusException_ReturnsCorrectStatus() {
        ResponseStatusException ex = new ResponseStatusException(
            org.springframework.http.HttpStatus.FORBIDDEN, "Forbidden"
        );
        
        ResponseEntity<Map<String, Object>> response = handler.handleResponseStatus(ex, request);
        
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }
}
