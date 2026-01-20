package com.profiling.model.psychometric;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "proctoring_violations")
public class ProctoringViolation {
    
    @Id
    private String id;
    
    private String sessionId;
    
    private String userId;
    
    private String violationType;
    
    private String severity;
    
    private LocalDateTime timestamp;
    
    private String snapshotUrl; // URL or path to stored snapshot
    
    private String description;
    
    // Constructors
    public ProctoringViolation() {}
    
    public ProctoringViolation(String sessionId, String userId, String violationType, String severity, LocalDateTime timestamp) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.violationType = violationType;
        this.severity = severity;
        this.timestamp = timestamp;
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
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getViolationType() {
        return violationType;
    }
    
    public void setViolationType(String violationType) {
        this.violationType = violationType;
    }
    
    public String getSeverity() {
        return severity;
    }
    
    public void setSeverity(String severity) {
        this.severity = severity;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getSnapshotUrl() {
        return snapshotUrl;
    }
    
    public void setSnapshotUrl(String snapshotUrl) {
        this.snapshotUrl = snapshotUrl;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
}

