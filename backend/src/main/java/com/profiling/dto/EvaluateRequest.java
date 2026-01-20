package com.profiling.dto;

import java.util.Map;

/**
 * Request DTO for evaluation endpoint
 */
public class EvaluateRequest {
    private UserProfile userProfile;
    private Map<String, String> answers; // question -> answer mapping

    public EvaluateRequest() {
    }

    public UserProfile getUserProfile() {
        return userProfile;
    }

    public void setUserProfile(UserProfile userProfile) {
        this.userProfile = userProfile;
    }

    public Map<String, String> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, String> answers) {
        this.answers = answers;
    }
}

