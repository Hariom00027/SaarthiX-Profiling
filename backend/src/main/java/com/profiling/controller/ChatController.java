package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.ChatRequest;
import com.profiling.exception.BadRequestException;
import com.profiling.service.ChatbotService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for chatbot chat endpoint
 */
@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatbotService chatbotService;
    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    public ChatController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    // Note: ChatController endpoints are already protected by SecurityConfig

    /**
     * POST endpoint to process chat messages
     * @param request Contains user message and conversation state
     * @return Next question or completion status
     */
    @PostMapping(value = "/chat", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> chat(@RequestBody ChatRequest request) {
        if (request == null || request.getUserMessage() == null || request.getUserMessage().trim().isEmpty()) {
            log.warn("Chat request missing user message");
            throw new BadRequestException("User message is required");
        }

        if (request.getConversationState() == null) {
            log.warn("Chat request missing conversation state");
            throw new BadRequestException("Conversation state is required");
        }

        log.info("Processing chat message");
        ChatbotService.ChatResponse chatResponse = chatbotService.processChat(request);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("nextQuestion", chatResponse.getNextQuestion());
        responseData.put("conversationState", chatResponse.getUpdatedState());
        responseData.put("isComplete", chatResponse.isComplete());
        responseData.put("botName", "Saathi");

        String message = chatResponse.isComplete()
            ? "Conversation completed successfully"
            : "Question processed successfully";

        ApiResponse response = new ApiResponse(message, responseData);
        return ResponseEntity
                .status(org.springframework.http.HttpStatus.OK)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }
}

