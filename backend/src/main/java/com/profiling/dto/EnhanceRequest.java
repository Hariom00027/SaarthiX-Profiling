package com.profiling.dto;

public class EnhanceRequest {
    private String profile;
    /** Optional user prompt to guide enhancement (max 50 words). */
    private String prompt;

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

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }
}

