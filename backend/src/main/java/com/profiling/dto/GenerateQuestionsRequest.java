package com.profiling.dto;

/**
 * Request DTO for generating personalized questions
 */
public class GenerateQuestionsRequest {
    private UserProfile userProfile;

    public GenerateQuestionsRequest() {
    }

    public UserProfile getUserProfile() {
        return userProfile;
    }

    public void setUserProfile(UserProfile userProfile) {
        this.userProfile = userProfile;
    }
}

