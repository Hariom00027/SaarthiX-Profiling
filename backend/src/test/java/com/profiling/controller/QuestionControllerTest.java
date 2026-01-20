package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.GenerateQuestionsRequest;
import com.profiling.dto.UserProfile;
import com.profiling.exception.BadRequestException;
import com.profiling.service.ChatbotService;
import com.profiling.service.OpenAIService;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("QuestionController Tests")
class QuestionControllerTest {

    @Mock
    private OpenAIService openAIService;

    @Mock
    private ChatbotService chatbotService;

    @InjectMocks
    private QuestionController controller;

    private GenerateQuestionsRequest validRequest;
    private UserProfile userProfile;
    private List<String> mockQuestions;

    @BeforeEach
    void setUp() {
        userProfile = new UserProfile();
        userProfile.setName("Test User");
        userProfile.setEmail("test@example.com");

        validRequest = new GenerateQuestionsRequest();
        validRequest.setUserProfile(userProfile);

        mockQuestions = Arrays.asList(
            "Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?",
            "Question 6?", "Question 7?", "Question 8?", "Question 9?", "Question 10?",
            "Question 11?", "Question 12?", "Question 13?", "Question 14?", "Question 15?"
        );
    }

    @Test
    @DisplayName("generateQuestions should return OK with valid request")
    void testGenerateQuestions_ValidRequest_ReturnsOk() {
        Map<String, String> profileMap = new HashMap<>();
        profileMap.put("name", "Test User");
        profileMap.put("email", "test@example.com");

        when(chatbotService.profileToMap(any(UserProfile.class))).thenReturn(profileMap);
        when(openAIService.generateQuestions(any(Map.class))).thenReturn(mockQuestions);

        ResponseEntity<ApiResponse> response = controller.generateQuestions(validRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Questions generated successfully", response.getBody().getMessage());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getBody().getData();
        assertEquals(15, data.get("totalQuestions"));
        assertNotNull(data.get("questions"));
        verify(openAIService).generateQuestions(profileMap);
    }

    @Test
    @DisplayName("generateQuestions should throw BadRequestException when request is null")
    void testGenerateQuestions_NullRequest_ThrowsBadRequestException() {
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.generateQuestions(null);
        });

        assertEquals("User profile is required", exception.getMessage());
        verify(openAIService, never()).generateQuestions(any());
    }

    @Test
    @DisplayName("generateQuestions should throw BadRequestException when userProfile is null")
    void testGenerateQuestions_NullUserProfile_ThrowsBadRequestException() {
        validRequest.setUserProfile(null);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.generateQuestions(validRequest);
        });

        assertEquals("User profile is required", exception.getMessage());
        verify(openAIService, never()).generateQuestions(any());
    }

    @Test
    @DisplayName("generateQuestions should handle service exception")
    void testGenerateQuestions_ServiceException_ThrowsException() {
        Map<String, String> profileMap = new HashMap<>();
        when(chatbotService.profileToMap(any(UserProfile.class))).thenReturn(profileMap);
        when(openAIService.generateQuestions(any(Map.class)))
            .thenThrow(new RuntimeException("OpenAI API error"));

        assertThrows(RuntimeException.class, () -> {
            controller.generateQuestions(validRequest);
        });
    }

    @Test
    @DisplayName("generateQuestions should handle empty questions list")
    void testGenerateQuestions_EmptyQuestions_ReturnsEmptyList() {
        Map<String, String> profileMap = new HashMap<>();
        when(chatbotService.profileToMap(any(UserProfile.class))).thenReturn(profileMap);
        when(openAIService.generateQuestions(any(Map.class))).thenReturn(Arrays.asList());

        ResponseEntity<ApiResponse> response = controller.generateQuestions(validRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getBody().getData();
        assertEquals(0, data.get("totalQuestions"));
    }
}
