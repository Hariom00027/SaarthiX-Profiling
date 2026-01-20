package com.profiling.controller;

import com.profiling.dto.SaveReportRequest;
import com.profiling.dto.SavedPsychometricReportResponse;
import com.profiling.model.SavedPsychometricReport;
import com.profiling.security.JwtUtil;
import com.profiling.service.SavedPsychometricReportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for managing saved psychometric reports
 */
@RestController
@RequestMapping("/api/psychometric/saved-reports")
public class SavedPsychometricReportController {

    private final SavedPsychometricReportService savedReportService;
    private final JwtUtil jwtUtil;

    public SavedPsychometricReportController(
            SavedPsychometricReportService savedReportService,
            JwtUtil jwtUtil) {
        this.savedReportService = savedReportService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Extract user ID from JWT token in request
     */
    private String getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.extractUserId(token);
        }
        throw new IllegalStateException("No valid authentication token found");
    }

    /**
     * Save a psychometric report
     * POST /api/psychometric/saved-reports
     */
    @PostMapping
    public ResponseEntity<SavedPsychometricReportResponse> saveReport(
            @Valid @RequestBody SaveReportRequest request,
            HttpServletRequest httpRequest) {
        try {
            String userId = getUserIdFromRequest(httpRequest);
            SavedPsychometricReport savedReport = savedReportService.saveReport(
                    userId, 
                    request.getSessionId(), 
                    request.getReportTitle()
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(SavedPsychometricReportResponse.from(savedReport));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    /**
     * Get all saved reports for the current user
     * GET /api/psychometric/saved-reports
     */
    @GetMapping
    public ResponseEntity<List<SavedPsychometricReportResponse>> getUserSavedReports(
            HttpServletRequest httpRequest) {
        try {
            String userId = getUserIdFromRequest(httpRequest);
            List<SavedPsychometricReport> savedReports = savedReportService.getUserSavedReports(userId);
            List<SavedPsychometricReportResponse> responses = savedReports.stream()
                    .map(SavedPsychometricReportResponse::from)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(responses);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    /**
     * Check if a report is saved
     * GET /api/psychometric/saved-reports/check/{sessionId}
     */
    @GetMapping("/check/{sessionId}")
    public ResponseEntity<Boolean> isReportSaved(
            @PathVariable String sessionId,
            HttpServletRequest httpRequest) {
        try {
            String userId = getUserIdFromRequest(httpRequest);
            boolean isSaved = savedReportService.isReportSaved(userId, sessionId);
            return ResponseEntity.ok(isSaved);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    /**
     * Delete a saved report
     * DELETE /api/psychometric/saved-reports/{sessionId}
     */
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSavedReport(
            @PathVariable String sessionId,
            HttpServletRequest httpRequest) {
        try {
            String userId = getUserIdFromRequest(httpRequest);
            savedReportService.deleteSavedReport(userId, sessionId);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}










