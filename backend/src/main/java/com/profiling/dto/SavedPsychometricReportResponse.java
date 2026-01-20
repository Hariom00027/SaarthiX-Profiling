package com.profiling.dto;

import com.profiling.model.SavedPsychometricReport;

import java.time.Instant;

/**
 * Response DTO for saved psychometric reports
 */
public class SavedPsychometricReportResponse {
    
    private String id;
    private String sessionId;
    private String userEmail;
    private String candidateName;
    private String reportTitle;
    private Instant savedAt;

    public static SavedPsychometricReportResponse from(SavedPsychometricReport savedReport) {
        SavedPsychometricReportResponse response = new SavedPsychometricReportResponse();
        response.id = savedReport.getId();
        response.sessionId = savedReport.getSessionId();
        response.userEmail = savedReport.getUserEmail();
        response.candidateName = savedReport.getCandidateName();
        response.reportTitle = savedReport.getReportTitle();
        response.savedAt = savedReport.getSavedAt();
        return response;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public String getReportTitle() {
        return reportTitle;
    }

    public void setReportTitle(String reportTitle) {
        this.reportTitle = reportTitle;
    }

    public Instant getSavedAt() {
        return savedAt;
    }

    public void setSavedAt(Instant savedAt) {
        this.savedAt = savedAt;
    }
}










