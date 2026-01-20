package com.profiling.dto.psychometric;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ProctoringViolationRequest {
    
    @NotBlank(message = "Session ID is required")
    private String sessionId;
    
    @NotBlank(message = "User ID is required")
    private String userId;
    
    @NotBlank(message = "Violation type is required")
    private String type;
    
    @NotNull(message = "Severity is required")
    private String severity;
    
    @NotBlank(message = "Timestamp is required")
    private String timestamp;
    
    private String snapshot; // Base64 encoded image
    
    private String description;
    
    // Constructors
    public ProctoringViolationRequest() {}
    
    public ProctoringViolationRequest(String sessionId, String userId, String type, 
                                     String severity, String timestamp, String snapshot) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.type = type;
        this.severity = severity;
        this.timestamp = timestamp;
        this.snapshot = snapshot;
    }
    
    // Getters and Setters
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
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getSeverity() {
        return severity;
    }
    
    public void setSeverity(String severity) {
        this.severity = severity;
    }
    
    public String getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getSnapshot() {
        return snapshot;
    }
    
    public void setSnapshot(String snapshot) {
        this.snapshot = snapshot;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    // Convenience method for compatibility
    public String getViolationType() {
        return type;
    }
}

