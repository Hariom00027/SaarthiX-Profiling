package com.profiling.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Entity for storing saved psychometric reports
 * Links a user to their saved psychometric test sessions
 */
@Document(collection = "saved_psychometric_reports")
public class SavedPsychometricReport {

    @Id
    private String id;

    @Indexed
    private String userId; // User who saved the report

    @Indexed
    private String sessionId; // Reference to PsychometricSession

    private String userEmail; // Cached for quick access
    
    private String candidateName; // Cached for quick access

    private String reportTitle; // Optional custom title

    @CreatedDate
    private Instant savedAt;

    // Constructor
    public SavedPsychometricReport() {
    }

    public SavedPsychometricReport(String userId, String sessionId, String userEmail, String candidateName) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.userEmail = userEmail;
        this.candidateName = candidateName;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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










