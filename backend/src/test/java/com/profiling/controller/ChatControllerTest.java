package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.ChatRequest;
import com.profiling.dto.ChatState;
import com.profiling.exception.BadRequestException;
import com.profiling.service.ChatbotService;
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
@DisplayName("ChatController Tests")
class ChatControllerTest {

    @Mock
    private ChatbotService chatbotService;

    @InjectMocks
    private ChatController controller;

    private ChatRequest validRequest;
    private ChatbotService.ChatResponse mockChatResponse;

    @BeforeEach
    void setUp() {
        ChatState conversationState = new ChatState();
        conversationState.setCurrentStage(1);
        conversationState.setCurrentQuestionIndex(0);
        conversationState.setQuestions(java.util.Arrays.asList("Q1", "Q2"));
        conversationState.setAnswers(new HashMap<>());

        validRequest = new ChatRequest();
        validRequest.setUserMessage("My answer");
        validRequest.setConversationState(conversationState);

        ChatState updatedState = new ChatState();
        updatedState.setCurrentStage(1);
        updatedState.setCurrentQuestionIndex(1);

        mockChatResponse = new ChatbotService.ChatResponse();
        mockChatResponse.setNextQuestion("Q2");
        mockChatResponse.setUpdatedState(updatedState);
        mockChatResponse.setComplete(false);
    }

    @Test
    @DisplayName("chat should return OK with valid request")
    void testChat_ValidRequest_ReturnsOk() {
        when(chatbotService.processChat(any(ChatRequest.class))).thenReturn(mockChatResponse);

        ResponseEntity<ApiResponse> response = controller.chat(validRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Question processed successfully", response.getBody().getMessage());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getBody().getData();
        assertEquals("Q2", data.get("nextQuestion"));
        assertEquals("Saathi", data.get("botName"));
        assertFalse((Boolean) data.get("isComplete"));
        verify(chatbotService).processChat(validRequest);
    }

    @Test
    @DisplayName("chat should return completion message when conversation is complete")
    void testChat_CompleteConversation_ReturnsCompletionMessage() {
        mockChatResponse.setComplete(true);
        mockChatResponse.setNextQuestion(null);
        when(chatbotService.processChat(any(ChatRequest.class))).thenReturn(mockChatResponse);

        ResponseEntity<ApiResponse> response = controller.chat(validRequest);

        assertEquals("Conversation completed successfully", response.getBody().getMessage());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getBody().getData();
        assertTrue((Boolean) data.get("isComplete"));
    }

    @Test
    @DisplayName("chat should throw BadRequestException when request is null")
    void testChat_NullRequest_ThrowsBadRequestException() {
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.chat(null);
        });

        assertEquals("User message is required", exception.getMessage());
        verify(chatbotService, never()).processChat(any());
    }

    @Test
    @DisplayName("chat should throw BadRequestException when userMessage is null")
    void testChat_NullUserMessage_ThrowsBadRequestException() {
        validRequest.setUserMessage(null);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.chat(validRequest);
        });

        assertEquals("User message is required", exception.getMessage());
        verify(chatbotService, never()).processChat(any());
    }

    @Test
    @DisplayName("chat should throw BadRequestException when userMessage is empty")
    void testChat_EmptyUserMessage_ThrowsBadRequestException() {
        validRequest.setUserMessage("   ");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.chat(validRequest);
        });

        assertEquals("User message is required", exception.getMessage());
        verify(chatbotService, never()).processChat(any());
    }

    @Test
    @DisplayName("chat should throw BadRequestException when conversationState is null")
    void testChat_NullConversationState_ThrowsBadRequestException() {
        validRequest.setConversationState(null);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            controller.chat(validRequest);
        });

        assertEquals("Conversation state is required", exception.getMessage());
        verify(chatbotService, never()).processChat(any());
    }

    @Test
    @DisplayName("chat should handle service exception")
    void testChat_ServiceException_ThrowsException() {
        when(chatbotService.processChat(any(ChatRequest.class)))
            .thenThrow(new RuntimeException("Service error"));

        assertThrows(RuntimeException.class, () -> {
            controller.chat(validRequest);
        });
    }
}
