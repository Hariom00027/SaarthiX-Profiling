package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.EnhanceRequest;
import com.profiling.dto.EnhanceResponse;
import com.profiling.exception.BadRequestException;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AIEnhanceController Tests")
class AIEnhanceControllerTest {

    @Mock
    private OpenAIService openAIService;

    @InjectMocks
    private AIEnhanceController controller;

    private EnhanceRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new EnhanceRequest();
        validRequest.setProfile("Original profile text");
    }

    @Test
    @DisplayName("enhanceProfile should return enhanced profile with valid request")
    void testEnhanceProfile_ValidRequest_ReturnsEnhanced() {
        String enhancedText = "Enhanced profile text";
        when(openAIService.enhanceProfile(anyString())).thenReturn(enhancedText);

        ResponseEntity<ApiResponse> response = controller.enhanceProfile(validRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Profile enhanced successfully", response.getBody().getMessage());
        EnhanceResponse enhanceResponse = (EnhanceResponse) response.getBody().getData();
        assertEquals(enhancedText, enhanceResponse.getEnhancedProfile());
        verify(openAIService).enhanceProfile("Original profile text");
    }

    @Test
    @DisplayName("enhanceProfile should throw BadRequestException when profile is null")
    void testEnhanceProfile_NullProfile_ThrowsBadRequestException() {
        validRequest.setProfile(null);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.enhanceProfile(validRequest);
        });

        assertEquals("Profile text is required", exception.getMessage());
        verify(openAIService, never()).enhanceProfile(anyString());
    }

    @Test
    @DisplayName("enhanceProfile should throw BadRequestException when profile is empty")
    void testEnhanceProfile_EmptyProfile_ThrowsBadRequestException() {
        validRequest.setProfile("");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.enhanceProfile(validRequest);
        });

        assertEquals("Profile text is required", exception.getMessage());
        verify(openAIService, never()).enhanceProfile(anyString());
    }

    @Test
    @DisplayName("enhanceProfile should throw BadRequestException when profile is whitespace")
    void testEnhanceProfile_WhitespaceProfile_ThrowsBadRequestException() {
        validRequest.setProfile("   ");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.enhanceProfile(validRequest);
        });

        assertEquals("Profile text is required", exception.getMessage());
        verify(openAIService, never()).enhanceProfile(anyString());
    }

    @Test
    @DisplayName("enhanceProfile should handle service exception")
    void testEnhanceProfile_ServiceException_ThrowsException() {
        when(openAIService.enhanceProfile(anyString()))
            .thenThrow(new RuntimeException("OpenAI API error"));

        assertThrows(RuntimeException.class, () -> {
            controller.enhanceProfile(validRequest);
        });
    }
}
