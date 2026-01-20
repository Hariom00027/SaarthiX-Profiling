package com.profiling.controller;

import com.profiling.dto.psychometric.CheatEventRequest;
import com.profiling.dto.psychometric.SubmitTestRequest;
import com.profiling.dto.psychometric.SubmitTestRequest.TestResults;
import com.profiling.dto.psychometric.SubmitTestResponse;
import com.profiling.service.psychometric.PsychometricSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PsychometricTestController Tests")
class PsychometricTestControllerTest {

    @Mock
    private PsychometricSessionService sessionService;

    @InjectMocks
    private PsychometricTestController controller;

    private SubmitTestRequest validSubmitRequest;
    private CheatEventRequest validCheatEventRequest;

    @BeforeEach
    void setUp() {
        TestResults results = new TestResults();
        results.setTotalQuestions(120);
        results.setAttempted(100);
        results.setNotAttempted(20);
        results.setCorrect(80);
        results.setWrong(20);
        results.setMarkedForReview(10);
        results.setAnsweredAndMarkedForReview(5);
        results.setSubmittedAt("2024-01-01T00:00:00Z");

        validSubmitRequest = new SubmitTestRequest();
        validSubmitRequest.setSessionId("session-123");
        validSubmitRequest.setUserId("user-123");
        validSubmitRequest.setTestId("test-123");
        validSubmitRequest.setAnswers(java.util.Map.of("q1", "answer1"));
        validSubmitRequest.setResults(results);

        validCheatEventRequest = new CheatEventRequest();
        validCheatEventRequest.setSessionId("session-123");
        validCheatEventRequest.setReason("Tab switched");
        validCheatEventRequest.setWarningCount(1);
        validCheatEventRequest.setTimestamp("2024-01-01T00:00:00Z");
    }

    @Test
    @DisplayName("submitTest should return OK with valid request")
    void testSubmitTest_ValidRequest_ReturnsOk() {
        SubmitTestResponse mockResponse = new SubmitTestResponse(
            "session-123", "user-123", "test-123", 120, 100, 20, 80, 20, "2024-01-01T00:00:00Z"
        );
        when(sessionService.submitTest(any(SubmitTestRequest.class))).thenReturn(mockResponse);

        ResponseEntity<SubmitTestResponse> response = controller.submitTest(validSubmitRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("session-123", response.getBody().getSessionId());
        verify(sessionService).submitTest(validSubmitRequest);
    }

    @Test
    @DisplayName("submitTest should handle service exception")
    void testSubmitTest_ServiceException_ThrowsException() {
        when(sessionService.submitTest(any(SubmitTestRequest.class)))
            .thenThrow(new IllegalArgumentException("Session not found"));

        assertThrows(IllegalArgumentException.class, () -> {
            controller.submitTest(validSubmitRequest);
        });
    }

    @Test
    @DisplayName("logCheatEvent should return OK with valid request")
    void testLogCheatEvent_ValidRequest_ReturnsOk() {
        doNothing().when(sessionService).logCheatEvent(any(CheatEventRequest.class));

        ResponseEntity<Void> response = controller.logCheatEvent(validCheatEventRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(sessionService).logCheatEvent(validCheatEventRequest);
    }

    @Test
    @DisplayName("logCheatEvent should handle service exception")
    void testLogCheatEvent_ServiceException_ThrowsException() {
        doThrow(new RuntimeException("Database error"))
            .when(sessionService).logCheatEvent(any(CheatEventRequest.class));

        assertThrows(RuntimeException.class, () -> {
            controller.logCheatEvent(validCheatEventRequest);
        });
    }

    @Test
    @DisplayName("submitTest should handle null sessionId")
    void testSubmitTest_NullSessionId_ValidationFails() {
        validSubmitRequest.setSessionId(null);
        // Validation would be handled by @Valid annotation
        // This test ensures the controller doesn't crash
        when(sessionService.submitTest(any())).thenThrow(new IllegalArgumentException("Session ID required"));

        assertThrows(IllegalArgumentException.class, () -> {
            controller.submitTest(validSubmitRequest);
        });
    }

    @Test
    @DisplayName("logCheatEvent should handle null reason")
    void testLogCheatEvent_NullReason_ValidationFails() {
        validCheatEventRequest.setReason(null);
        // Validation would be handled by @Valid annotation
        doThrow(new IllegalArgumentException("Reason required"))
            .when(sessionService).logCheatEvent(any(CheatEventRequest.class));

        assertThrows(IllegalArgumentException.class, () -> {
            controller.logCheatEvent(validCheatEventRequest);
        });
    }
}
