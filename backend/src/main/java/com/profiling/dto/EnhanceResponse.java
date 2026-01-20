package com.profiling.dto;

public class EnhanceResponse {
    private String enhancedProfile;

    public EnhanceResponse() {
    }

    public EnhanceResponse(String enhancedProfile) {
        this.enhancedProfile = enhancedProfile;
    }

    public String getEnhancedProfile() {
        return enhancedProfile;
    }

    public void setEnhancedProfile(String enhancedProfile) {
        this.enhancedProfile = enhancedProfile;
    }
}

