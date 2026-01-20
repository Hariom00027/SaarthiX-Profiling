package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.EvaluateRequest;
import com.profiling.dto.EvaluationResult;
import com.profiling.dto.UserProfile;
import com.profiling.exception.BadRequestException;
import com.profiling.service.EvaluationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EvaluationController Tests")
class EvaluationControllerTest {

    @Mock
    private EvaluationService evaluationService;

    @InjectMocks
    private EvaluationController controller;

    private EvaluateRequest validRequest;
    private EvaluationResult mockResult;

    @BeforeEach
    void setUp() {
        UserProfile profile = new UserProfile();
        profile.setName("Test User");
        profile.setEmail("test@example.com");

        Map<String, String> answers = new HashMap<>();
        answers.put("Q1", "Answer 1");
        answers.put("Q2", "Answer 2");

        validRequest = new EvaluateRequest();
        validRequest.setUserProfile(profile);
        validRequest.setAnswers(answers);

        mockResult = new EvaluationResult();
        Map<String, Double> interests = new HashMap<>();
        interests.put("Technology", 40.0);
        interests.put("Business", 35.0);
        interests.put("Arts", 25.0);
        mockResult.setInterests(interests);
    }

    @Test
    @DisplayName("evaluate should return OK with valid request")
    void testEvaluate_ValidRequest_ReturnsOk() {
        when(evaluationService.evaluate(any(UserProfile.class), any(Map.class)))
            .thenReturn(mockResult);

        ResponseEntity<ApiResponse> response = controller.evaluate(validRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Evaluation completed successfully", response.getBody().getMessage());
        verify(evaluationService).evaluate(validRequest.getUserProfile(), validRequest.getAnswers());
    }

    @Test
    @DisplayName("evaluate should throw BadRequestException when userProfile is null")
    void testEvaluate_NullUserProfile_ThrowsBadRequestException() {
        validRequest.setUserProfile(null);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.evaluate(validRequest);
        });

        assertEquals("User profile is required", exception.getMessage());
        verify(evaluationService, never()).evaluate(any(), any());
    }

    @Test
    @DisplayName("evaluate should throw BadRequestException when request is null")
    void testEvaluate_NullRequest_ThrowsBadRequestException() {
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.evaluate(null);
        });

        assertEquals("User profile is required", exception.getMessage());
        verify(evaluationService, never()).evaluate(any(), any());
    }

    @Test
    @DisplayName("evaluate should throw BadRequestException when answers are null")
    void testEvaluate_NullAnswers_ThrowsBadRequestException() {
        validRequest.setAnswers(null);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.evaluate(validRequest);
        });

        assertEquals("Answers are required", exception.getMessage());
        verify(evaluationService, never()).evaluate(any(), any());
    }

    @Test
    @DisplayName("evaluate should throw BadRequestException when answers are empty")
    void testEvaluate_EmptyAnswers_ThrowsBadRequestException() {
        validRequest.setAnswers(new HashMap<>());

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.evaluate(validRequest);
        });

        assertEquals("Answers are required", exception.getMessage());
        verify(evaluationService, never()).evaluate(any(), any());
    }

    @Test
    @DisplayName("evaluate should handle service exception")
    void testEvaluate_ServiceException_ThrowsException() {
        when(evaluationService.evaluate(any(UserProfile.class), any(Map.class)))
            .thenThrow(new RuntimeException("Service error"));

        assertThrows(RuntimeException.class, () -> {
            controller.evaluate(validRequest);
        });
    }
}
