package com.profiling.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.profiling.dto.psychometric.ProctoringViolationRequest;
import com.profiling.model.psychometric.ProctoringViolation;
import com.profiling.service.psychometric.ProctoringService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/test/proctoring")
@Validated
public class ProctoringController {
    
    private final ProctoringService proctoringService;
    
    public ProctoringController(ProctoringService proctoringService) {
        this.proctoringService = proctoringService;
    }
    
    /**
     * Log a proctoring violation
     */
    @PostMapping("/violation")
    public ResponseEntity<Map<String, String>> logViolation(
            @Valid @RequestBody ProctoringViolationRequest request) {
        proctoringService.logViolation(request);
        return ResponseEntity.status(HttpStatus.OK)
            .body(Map.of("message", "Violation logged successfully"));
    }
    
    /**
     * Get all violations for a session
     */
    @GetMapping("/violations/{sessionId}")
    public ResponseEntity<List<ProctoringViolation>> getSessionViolations(
            @PathVariable String sessionId) {
        List<ProctoringViolation> violations = proctoringService.getSessionViolations(sessionId);
        return ResponseEntity.ok(violations);
    }
    
    /**
     * Get violation statistics for a session
     */
    @GetMapping("/violations/{sessionId}/stats")
    public ResponseEntity<Map<String, Long>> getViolationStats(
            @PathVariable String sessionId) {
        Map<String, Long> stats = proctoringService.getViolationStats(sessionId);
        return ResponseEntity.ok(stats);
    }
}









