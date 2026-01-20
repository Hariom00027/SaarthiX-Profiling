package com.profiling.service;

import com.profiling.dto.EvaluationResult;
import com.profiling.dto.UserProfile;
import com.profiling.exception.BadRequestException;
import com.profiling.service.OpenAIService;
import com.profiling.util.AnswerQualityUtils;
import com.profiling.util.JsonValidator;
import com.profiling.util.ScoreUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EvaluationService Tests")
class EvaluationServiceTest {

    @Mock
    private OpenAIService openAIService;

    @InjectMocks
    private EvaluationService evaluationService;

    private UserProfile userProfile;
    private Map<String, String> answers;

    @BeforeEach
    void setUp() {
        userProfile = new UserProfile();
        userProfile.setName("Test User");
        userProfile.setEmail("test@example.com");

        answers = new HashMap<>();
        answers.put("Q1", "Answer 1");
        answers.put("Q2", "Answer 2");
    }

    @Test
    @DisplayName("evaluate should throw BadRequestException when userProfile is null")
    void testEvaluate_NullUserProfile_ThrowsException() {
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            evaluationService.evaluate(null, answers);
        });

        assertEquals("User profile is required", exception.getMessage());
        verify(openAIService, never()).evaluateInterests(any(), any(), any());
    }

    @Test
    @DisplayName("evaluate should throw BadRequestException when answers is null")
    void testEvaluate_NullAnswers_ThrowsException() {
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            evaluationService.evaluate(userProfile, null);
        });

        assertEquals("Answers are required", exception.getMessage());
        verify(openAIService, never()).evaluateInterests(any(), any(), any());
    }

    @Test
    @DisplayName("evaluate should throw BadRequestException when answers is empty")
    void testEvaluate_EmptyAnswers_ThrowsException() {
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            evaluationService.evaluate(userProfile, new HashMap<>());
        });

        assertEquals("Answers are required", exception.getMessage());
    }

    @Test
    @DisplayName("evaluate should throw BadRequestException when OpenAI returns invalid JSON")
    void testEvaluate_InvalidJson_ThrowsException() {
        when(openAIService.evaluateInterests(anyMap(), anyMap(), anyMap()))
            .thenReturn("Invalid JSON response");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            evaluationService.evaluate(userProfile, answers);
        });

        assertTrue(exception.getMessage().contains("Invalid response"));
    }

    @Test
    @DisplayName("evaluate should handle service exception")
    void testEvaluate_ServiceException_ThrowsException() {
        when(openAIService.evaluateInterests(anyMap(), anyMap(), anyMap()))
            .thenThrow(new RuntimeException("OpenAI API error"));

        assertThrows(RuntimeException.class, () -> {
            evaluationService.evaluate(userProfile, answers);
        });
    }
}
