package com.profiling.service;

import java.util.Map;
import java.util.Optional;

import com.profiling.dto.ProfileRequestDTO;
import com.profiling.model.Profile;
import com.profiling.model.ProfileResponse;
import com.profiling.dto.RegenerateProfileRequest;
import com.profiling.dto.EnhanceProfileRequest;
import com.profiling.template.TemplateRenderResult;

public interface ProfileService {
    
    /**
     * Save a profile to the database and generate template
     * @param profile The profile entity to save
     * @param userId The user ID who owns this profile
     * @return ProfileResponse containing the saved profile and generated template
     */
    ProfileResponse saveProfile(Profile profile, String userId);
    
    /**
     * Retrieve a profile by its ID and userId
     * @param id The profile ID
     * @param userId The user ID
     * @return Optional containing the profile if found
     */
    Optional<Profile> getProfileById(String id, String userId);

    /**
     * Generate the template paragraph for a given profile
     * @param profile The profile to use for template generation
     * @return Rendered template with metadata
     */
    TemplateRenderResult generateTemplate(Profile profile);

    /**
     * Update profile fields for a given profile id
     * @param id Profile identifier
     * @param dto Request payload containing fields to update
     * @param userId The user ID
     * @return Updated profile entity
     */
    Profile updateProfile(String id, ProfileRequestDTO dto, String userId);
    
    /**
     * Save profile as JSON file
     * @param id Profile identifier
     * @param userId The user ID
     * @return Path to the saved JSON file
     */
    String saveProfileAsJson(String id, String userId);
    
    /**
     * Get the current user's saved profile
     * @param userId The user ID
     * @return ProfileResponse containing the saved profile and generated template, or null if not found
     */
    ProfileResponse getCurrentUserProfile(String userId);
    
    /**
     * Get all saved profiles for a user (up to 3 most recent)
     * @param userId The user ID
     * @return List of ProfileResponse containing all saved profiles sorted by createdAt (newest first)
     */
    java.util.List<ProfileResponse> getAllUserProfiles(String userId);

    /**
     * Regenerate the saved profile content by combining user data, chat answers, and report insights.
     * @param request Regeneration request payload containing template and context data
     * @param userId Authenticated user's ID
     * @return ProfileResponse containing the refreshed profile and template text
     */
    ProfileResponse regenerateProfile(RegenerateProfileRequest request, String userId);

    /**
     * Enhance profile with psychometric report data insights
     * @param request The enhance profile request containing profile and report data
     * @param userId The authenticated user's ID
     * @return ProfileResponse containing the enhanced profile and updated template
     */
    ProfileResponse enhanceProfileWithReport(EnhanceProfileRequest request, String userId);
}

