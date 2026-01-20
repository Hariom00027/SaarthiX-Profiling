package com.profiling.service;

import com.profiling.dto.ChatRequest;
import com.profiling.dto.ChatState;
import com.profiling.dto.UserProfile;
import com.profiling.service.ChatbotService.ChatResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatbotService Tests")
class ChatbotServiceTest {

    @InjectMocks
    private ChatbotService chatbotService;

    private ChatRequest validRequest;
    private ChatState conversationState;

    @BeforeEach
    void setUp() {
        List<String> questions = Arrays.asList("Q1", "Q2", "Q3");
        conversationState = new ChatState();
        conversationState.setCurrentStage(1);
        conversationState.setCurrentQuestionIndex(0);
        conversationState.setQuestions(questions);
        conversationState.setAnswers(new HashMap<>());

        validRequest = new ChatRequest();
        validRequest.setUserMessage("My answer");
        validRequest.setConversationState(conversationState);
    }

    @Test
    @DisplayName("profileToMap should convert UserProfile to Map")
    void testProfileToMap_ValidProfile_ReturnsMap() {
        UserProfile profile = new UserProfile();
        profile.setName("Test User");
        profile.setEmail("test@example.com");

        Map<String, String> result = chatbotService.profileToMap(profile);

        assertNotNull(result);
        assertEquals("Test User", result.get("name"));
        assertEquals("test@example.com", result.get("email"));
    }

    @Test
    @DisplayName("profileToMap should handle null profile")
    void testProfileToMap_NullProfile_ReturnsEmptyMap() {
        Map<String, String> result = chatbotService.profileToMap(null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("processChat should return next question when not complete")
    void testProcessChat_NotComplete_ReturnsNextQuestion() {
        ChatResponse response = chatbotService.processChat(validRequest);

        assertNotNull(response);
        assertFalse(response.isComplete());
        assertNotNull(response.getNextQuestion());
    }

    @Test
    @DisplayName("processChat should mark complete when all questions answered")
    void testProcessChat_AllQuestionsAnswered_MarksComplete() {
        // Set up state with all questions answered
        Map<String, String> allAnswers = new HashMap<>();
        allAnswers.put("Q1", "Answer 1");
        allAnswers.put("Q2", "Answer 2");
        allAnswers.put("Q3", "Answer 3");
        conversationState.setAnswers(allAnswers);
        conversationState.setCurrentQuestionIndex(2);
        validRequest.setConversationState(conversationState);
        validRequest.setUserMessage("Answer 3");

        ChatResponse response = chatbotService.processChat(validRequest);

        assertTrue(response.isComplete());
    }
}
