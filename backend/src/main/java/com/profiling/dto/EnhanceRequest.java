package com.profiling.dto;

public class EnhanceRequest {
    private String profile;

    public EnhanceRequest() {
    }

    public EnhanceRequest(String profile) {
        this.profile = profile;
    }

    public String getProfile() {
        return profile;
    }

    public void setProfile(String profile) {
        this.profile = profile;
    }
}

