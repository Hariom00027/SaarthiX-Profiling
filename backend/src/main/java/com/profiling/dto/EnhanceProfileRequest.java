package com.profiling.dto;

import com.profiling.model.Profile;

import java.util.Map;

/**
 * DTO for profile enhancement request using psychometric report data
 */
public class EnhanceProfileRequest {
    
    private String profileId;
    private Profile profileData;
    private Map<String, Object> reportData;
    private String sessionId;
    
    public EnhanceProfileRequest() {}
    
    public String getProfileId() {
        return profileId;
    }
    
    public void setProfileId(String profileId) {
        this.profileId = profileId;
    }
    
    public Profile getProfileData() {
        return profileData;
    }
    
    public void setProfileData(Profile profileData) {
        this.profileData = profileData;
    }
    
    public Map<String, Object> getReportData() {
        return reportData;
    }
    
    public void setReportData(Map<String, Object> reportData) {
        this.reportData = reportData;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}










