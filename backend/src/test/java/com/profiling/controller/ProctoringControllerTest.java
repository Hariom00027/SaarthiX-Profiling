package com.profiling.controller;

import com.profiling.dto.psychometric.ProctoringViolationRequest;
import com.profiling.model.psychometric.ProctoringViolation;
import com.profiling.service.psychometric.ProctoringService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProctoringController Tests")
class ProctoringControllerTest {

    @Mock
    private ProctoringService proctoringService;

    @InjectMocks
    private ProctoringController controller;

    private ProctoringViolationRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new ProctoringViolationRequest();
        validRequest.setSessionId("session-123");
        validRequest.setReason("Tab switched");
        validRequest.setTimestamp("2024-01-01T00:00:00Z");
    }

    @Test
    @DisplayName("logViolation should return OK with valid request")
    void testLogViolation_ValidRequest_ReturnsOk() {
        doNothing().when(proctoringService).logViolation(any(ProctoringViolationRequest.class));

        ResponseEntity<Map<String, String>> response = controller.logViolation(validRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Violation logged successfully", response.getBody().get("message"));
        verify(proctoringService).logViolation(validRequest);
    }

    @Test
    @DisplayName("getSessionViolations should return violations list")
    void testGetSessionViolations_ValidSessionId_ReturnsViolations() {
        ProctoringViolation violation1 = new ProctoringViolation();
        violation1.setSessionId("session-123");
        violation1.setReason("Tab switched");
        
        ProctoringViolation violation2 = new ProctoringViolation();
        violation2.setSessionId("session-123");
        violation2.setReason("Multiple faces");

        List<ProctoringViolation> violations = Arrays.asList(violation1, violation2);
        when(proctoringService.getSessionViolations("session-123")).thenReturn(violations);

        ResponseEntity<List<ProctoringViolation>> response = controller.getSessionViolations("session-123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().size());
        verify(proctoringService).getSessionViolations("session-123");
    }

    @Test
    @DisplayName("getSessionViolations should return empty list when no violations")
    void testGetSessionViolations_NoViolations_ReturnsEmptyList() {
        when(proctoringService.getSessionViolations("session-123")).thenReturn(Arrays.asList());

        ResponseEntity<List<ProctoringViolation>> response = controller.getSessionViolations("session-123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    @DisplayName("getViolationStats should return statistics")
    void testGetViolationStats_ValidSessionId_ReturnsStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", 5L);
        stats.put("tab_switched", 2L);
        stats.put("multiple_faces", 3L);

        when(proctoringService.getViolationStats("session-123")).thenReturn(stats);

        ResponseEntity<Map<String, Long>> response = controller.getViolationStats("session-123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(5L, response.getBody().get("total"));
        assertEquals(2L, response.getBody().get("tab_switched"));
        verify(proctoringService).getViolationStats("session-123");
    }

    @Test
    @DisplayName("logViolation should handle service exception")
    void testLogViolation_ServiceException_ThrowsException() {
        doThrow(new RuntimeException("Database error"))
            .when(proctoringService).logViolation(any(ProctoringViolationRequest.class));

        assertThrows(RuntimeException.class, () -> {
            controller.logViolation(validRequest);
        });
    }
}
