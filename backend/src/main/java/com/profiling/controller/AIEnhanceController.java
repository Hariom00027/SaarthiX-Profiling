package com.profiling.controller;

import com.profiling.dto.EnhanceRequest;
import com.profiling.dto.EnhanceResponse;
import com.profiling.dto.ApiResponse;
import com.profiling.exception.BadRequestException;
import com.profiling.service.OpenAIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AIEnhanceController {

    private final OpenAIService openAIService;
    private static final Logger log = LoggerFactory.getLogger(AIEnhanceController.class);

    @Autowired
    public AIEnhanceController(OpenAIService openAIService) {
        this.openAIService = openAIService;
    }

    /**
     * POST endpoint to enhance profile using AI
     * @param request The profile text to enhance
     * @return The enhanced profile text
     */
    @PostMapping(value = "/ai-enhance", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> enhanceProfile(@RequestBody EnhanceRequest request) {
        if (request.getProfile() == null || request.getProfile().trim().isEmpty()) {
            log.warn("Enhance profile request missing profile text");
            throw new BadRequestException("Profile text is required");
        }

        log.info("Enhancing profile text via AI");
        String enhancedProfile = openAIService.enhanceProfile(request.getProfile());
        EnhanceResponse responseDTO = new EnhanceResponse(enhancedProfile);

        ApiResponse response = new ApiResponse("Profile enhanced successfully", responseDTO);
        return ResponseEntity
                .status(HttpStatus.OK)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }
}

