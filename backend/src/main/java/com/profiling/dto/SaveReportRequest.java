package com.profiling.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for saving a psychometric report
 */
public class SaveReportRequest {
    
    @NotBlank(message = "Session ID is required")
    private String sessionId;
    
    private String reportTitle; // Optional custom title

    // Getters and Setters
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getReportTitle() {
        return reportTitle;
    }

    public void setReportTitle(String reportTitle) {
        this.reportTitle = reportTitle;
    }
}










