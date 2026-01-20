package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.EvaluateRequest;
import com.profiling.dto.EvaluationResult;
import com.profiling.exception.BadRequestException;
import com.profiling.service.EvaluationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for evaluation endpoint
 */
@RestController
@RequestMapping("/api")
public class EvaluationController {

    private final EvaluationService evaluationService;
    private static final Logger log = LoggerFactory.getLogger(EvaluationController.class);

    @Autowired
    public EvaluationController(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    /**
     * POST endpoint to evaluate user interests
     * @param request Contains user profile and all answers
     * @return Comprehensive evaluation result
     */
    @PostMapping(value = "/evaluate", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> evaluate(@RequestBody EvaluateRequest request) {
        if (request == null || request.getUserProfile() == null) {
            log.warn("Evaluation request missing user profile");
            throw new BadRequestException("User profile is required");
        }

        if (request.getAnswers() == null || request.getAnswers().isEmpty()) {
            log.warn("Evaluation request missing answers");
            throw new BadRequestException("Answers are required");
        }

        log.info("Evaluating interests for user");
        EvaluationResult result = evaluationService.evaluate(
                request.getUserProfile(),
                request.getAnswers()
        );

        ApiResponse response = new ApiResponse("Evaluation completed successfully", result);
        return ResponseEntity
                .status(org.springframework.http.HttpStatus.OK)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }
}

