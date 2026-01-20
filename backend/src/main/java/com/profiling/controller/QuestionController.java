package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.GenerateQuestionsRequest;
import com.profiling.dto.UserProfile;
import com.profiling.exception.BadRequestException;
import com.profiling.service.ChatbotService;
import com.profiling.service.OpenAIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for question generation endpoint
 */
@RestController
@RequestMapping("/api")
public class QuestionController {

    private final OpenAIService openAIService;
    private final ChatbotService chatbotService;
    private static final Logger log = LoggerFactory.getLogger(QuestionController.class);

    @Autowired
    public QuestionController(OpenAIService openAIService, ChatbotService chatbotService) {
        this.openAIService = openAIService;
        this.chatbotService = chatbotService;
    }

    /**
     * POST endpoint to generate personalized questions
     * @param request Contains user profile
     * @return List of 15 personalized questions
     */
    @PostMapping(value = "/generate-questions", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> generateQuestions(@RequestBody GenerateQuestionsRequest request) {
        if (request == null || request.getUserProfile() == null) {
            log.warn("Question generation request missing user profile");
            throw new BadRequestException("User profile is required");
        }

        UserProfile profile = request.getUserProfile();
        Map<String, String> profileMap = chatbotService.profileToMap(profile);

        log.info("Generating questions for user profile");
        List<String> questions = openAIService.generateQuestions(profileMap);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("questions", questions);
        responseData.put("totalQuestions", questions.size());

        ApiResponse response = new ApiResponse("Questions generated successfully", responseData);
        return ResponseEntity
                .status(org.springframework.http.HttpStatus.OK)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }
}

