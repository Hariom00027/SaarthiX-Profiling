package com.profiling.service;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.mongodb.MongoException;
import com.profiling.dto.ProfileRequestDTO;
import com.profiling.dto.RegenerateProfileRequest;
import com.profiling.dto.EnhanceProfileRequest;
import com.profiling.exception.BadRequestException;
import com.profiling.exception.DataSaveException;
import com.profiling.exception.DatabaseConnectionException;
import com.profiling.exception.ResourceNotFoundException;
import com.profiling.exception.UnauthorizedException;
import com.profiling.model.Profile;
import com.profiling.model.ProfileResponse;
import com.profiling.repository.ProfileRepository;
import com.profiling.service.OpenAIService;
import com.profiling.template.TemplateFactory;
import com.profiling.template.TemplateRenderResult;
import com.profiling.template.TemplateService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;

@Service
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final TemplateFactory templateFactory;
    private final ProfileJsonService profileJsonService;
    private final TemplateService templateService;
    private final OpenAIService openAIService;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    private static final Logger log = LoggerFactory.getLogger(ProfileServiceImpl.class);

    @Autowired
    public ProfileServiceImpl(ProfileRepository profileRepository, 
                             TemplateFactory templateFactory,
                             ProfileJsonService profileJsonService,
                             TemplateService templateService,
                             OpenAIService openAIService) {
        this.profileRepository = profileRepository;
        this.templateFactory = templateFactory;
        this.profileJsonService = profileJsonService;
        this.templateService = templateService;
        this.openAIService = openAIService;
    }

    @Override
    public ProfileResponse saveProfile(Profile profile, String userId) {
        if (profile == null) {
            throw new BadRequestException("Profile data is required");
        }
        ensureUserContext(userId);

        validateTemplateType(profile.getTemplateType(), userId);

        profile.setUserId(userId);
        profile.setAiEnhancedTemplateText(null);
        
        // For new profiles (no ID or ID is empty), always set createdAt to now
        // For existing profiles, preserve the original createdAt
        if (profile.getId() == null || profile.getId().isEmpty()) {
            // This is a new profile - set createdAt to now
            profile.setCreatedAt(java.time.LocalDateTime.now());
            log.info("Creating new profile for userId={} with createdAt={}", userId, profile.getCreatedAt());
        } else {
            // This is an existing profile - preserve createdAt if it exists, otherwise set it
            if (profile.getCreatedAt() == null) {
                profile.setCreatedAt(java.time.LocalDateTime.now());
                log.info("Existing profile {} for userId={} had no createdAt, setting to now", profile.getId(), userId);
            } else {
                log.info("Preserving existing createdAt={} for profile {} userId={}", 
                        profile.getCreatedAt(), profile.getId(), userId);
            }
        }
        
        // Check if this is a new profile (no ID) or an update (has ID)
        boolean isNewProfile = profile.getId() == null || profile.getId().isEmpty();
        
        Profile savedProfile;
        try {
            savedProfile = persistProfile(profile);
            if (isNewProfile) {
                log.info("New profile created userId={} profileId={} createdAt={}", 
                        userId, savedProfile.getId(), savedProfile.getCreatedAt());
            } else {
                log.info("Profile updated userId={} profileId={} createdAt={}", 
                        userId, savedProfile.getId(), savedProfile.getCreatedAt());
            }
        } catch (Exception e) {
            log.error("Failed to persist profile for userId={}: {}", userId, e.getMessage(), e);
            throw new DataSaveException("Failed to save profile: " + e.getMessage(), e);
        }
        
        // Only cleanup old profiles when creating a NEW profile
        // This ensures we keep the newest 3 including the one just created
        // Don't cleanup on updates - we want to preserve all existing profiles when updating
        if (isNewProfile) {
            try {
                keepLastNProfiles(userId, 3);
            } catch (Exception e) {
                log.warn("Failed to cleanup old profiles for userId={}, but profile was saved: {}", 
                        userId, e.getMessage());
                // Don't throw - profile was saved successfully
            }
        } else {
            log.info("Skipping cleanup for profile update userId={} profileId={}", userId, savedProfile.getId());
        }
        
        // Save profile as JSON file
        try {
            String jsonPath = profileJsonService.saveProfileAsJson(savedProfile);
            log.info("Profile {} saved as JSON at {}", savedProfile.getId(), jsonPath);
        } catch (Exception e) {
            log.warn("Failed to save profile {} as JSON: {}", savedProfile.getId(), e.getMessage());
        }
        
        TemplateRenderResult renderResult = applyAiOverride(
                templateFactory.generate(savedProfile.getTemplateType(), savedProfile),
                savedProfile);
        return new ProfileResponse(savedProfile, renderResult);
    }

    @Override
    public Optional<Profile> getProfileById(String id, String userId) {
        ensureUserContext(userId);
        Optional<Profile> profile = findProfileByIdAndUser(id, userId);
        profile.ifPresent(p -> log.info("Profile {} fetched for userId={}", p.getId(), userId));
        return profile;
    }

    @Override
    public TemplateRenderResult generateTemplate(Profile profile) {
        if (profile == null) {
            throw new BadRequestException("Profile is required for template generation");
        }
        log.info("Generating template {} for profile {}", profile.getTemplateType(), profile.getId());
        TemplateRenderResult renderResult = templateFactory.generate(profile.getTemplateType(), profile);
        return applyAiOverride(renderResult, profile);
    }

    @Override
    public Profile updateProfile(String id, ProfileRequestDTO dto, String userId) {
        ensureUserContext(userId);
        if (dto == null) {
            throw new BadRequestException("Update payload is required");
        }
        Profile existingProfile = findProfileByIdAndUser(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if (dto.getTemplateType() != null) {
            validateTemplateType(dto.getTemplateType(), userId);
        }

        // Preserve createdAt when updating
        java.time.LocalDateTime originalCreatedAt = existingProfile.getCreatedAt();
        applyUpdates(existingProfile, dto);
        // Restore createdAt if it was set
        if (originalCreatedAt != null) {
            existingProfile.setCreatedAt(originalCreatedAt);
        }

        Profile saved = persistProfile(existingProfile);
        log.info("Profile {} updated for userId={}", id, userId);
        return saved;
    }

    @Override
    public ProfileResponse regenerateProfile(RegenerateProfileRequest request, String userId) {
        ensureUserContext(userId);

        if (request == null || request.getFormData() == null || request.getFormData().isEmpty()) {
            throw new BadRequestException("Form data is required to regenerate the profile");
        }

        if (StringUtils.hasText(request.getUserId()) && !request.getUserId().equals(userId)) {
            throw new UnauthorizedException("Token user mismatch");
        }

        String templateId = StringUtils.hasText(request.getTemplateId())
                ? request.getTemplateId()
                : (String) request.getFormData().get("templateType");

        if (!StringUtils.hasText(templateId)) {
            throw new BadRequestException("Template type is required for regeneration");
        }

        validateTemplateType(templateId, userId);

        Map<String, Object> formData = request.getFormData();
        log.info("RegenerateProfile payload userId={}, templateId={}, formEntries={}, chatAnswers={}, reportData={}",
                userId,
                templateId,
                formData.keySet(),
                request.getChatAnswers(),
                request.getReportData());

        Profile profile = objectMapper.convertValue(sanitizeForModel(formData), Profile.class);
        profile.setUserId(userId);
        profile.setTemplateType(templateId);

        // Preserve profileImage from existing profile if not provided in formData
        String profileImageFromForm = profile.getProfileImage();
        if (!StringUtils.hasText(profileImageFromForm)) {
            // Get existing profile to preserve the image
            List<Profile> existingProfiles = findProfilesByUserId(userId);
            if (!existingProfiles.isEmpty()) {
                // Get the most recent profile
                existingProfiles.sort((p1, p2) -> {
                    java.time.LocalDateTime date1 = p1.getCreatedAt();
                    java.time.LocalDateTime date2 = p2.getCreatedAt();
                    if (date1 != null && date2 != null) {
                        return date2.compareTo(date1);
                    } else if (date1 != null) {
                        return -1;
                    } else if (date2 != null) {
                        return 1;
                    } else {
                        return p2.getId().compareTo(p1.getId());
                    }
                });
                Profile existingProfile = existingProfiles.get(0);
                if (StringUtils.hasText(existingProfile.getProfileImage())) {
                    profile.setProfileImage(existingProfile.getProfileImage());
                    log.info("Preserved profileImage from existing profile for userId={}", userId);
                }
            }
        } else {
            log.info("Using profileImage from formData for userId={}", userId);
        }

        TemplateRenderResult baseRender = templateFactory.generate(templateId, profile);
        String prompt = buildRegenerationPrompt(formData, request, baseRender.getRenderedText(), templateId);

        String enhancedText;
        try {
            enhancedText = openAIService.enhanceProfile(prompt);
        } catch (RuntimeException ex) {
            log.error("Failed to regenerate profile for userId={}: {}", userId, ex.getMessage(), ex);
            throw new DataSaveException("Failed to regenerate profile using AI", ex);
        }

        profile.setAiEnhancedTemplateText(enhancedText);
        Profile savedProfile = persistProfile(profile);
        TemplateRenderResult renderResult = applyAiOverride(
                templateFactory.generate(templateId, savedProfile),
                savedProfile);
        return new ProfileResponse(savedProfile, renderResult);
    }

    @Override
    public String saveProfileAsJson(String id, String userId) {
        ensureUserContext(userId);
        if (id == null || id.isBlank()) {
            throw new BadRequestException("Profile id is required");
        }
        Profile profile = findProfileByIdAndUser(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        
        try {
            String path = profileJsonService.saveProfileAsJson(profile);
            log.info("Profile {} saved as JSON for userId={} at {}", id, userId, path);
            return path;
        } catch (IOException e) {
            log.error("Failed to save profile {} as JSON: {}", id, e.getMessage(), e);
            throw new DataSaveException("Failed to save profile as JSON", e);
        }
    }

    @Override
    public ProfileResponse getCurrentUserProfile(String userId) {
        ensureUserContext(userId);
        List<Profile> profiles = findProfilesByUserId(userId);
        if (profiles.isEmpty()) {
            return null;
        }
        
        // Get the most recent profile (first one after sorting by createdAt descending)
        // Sort by createdAt descending to get newest first
        profiles.sort((p1, p2) -> {
            java.time.LocalDateTime date1 = p1.getCreatedAt();
            java.time.LocalDateTime date2 = p2.getCreatedAt();
            
            if (date1 != null && date2 != null) {
                return date2.compareTo(date1); // Descending order (newest first)
            } else if (date1 != null) {
                return -1;
            } else if (date2 != null) {
                return 1;
            } else {
                // Fallback to ObjectId comparison
                return p2.getId().compareTo(p1.getId());
            }
        });
        Profile profile = profiles.get(0);
        log.info("Current profile fetched for userId={} profileId={} (total profiles: {})", 
                userId, profile.getId(), profiles.size());
        TemplateRenderResult renderResult = applyAiOverride(
                templateFactory.generate(profile.getTemplateType(), profile),
                profile);
        return new ProfileResponse(profile, renderResult);
    }

    private void applyUpdates(Profile profile, ProfileRequestDTO dto) {
        if (dto.getName() != null) {
            profile.setName(dto.getName());
        }
        if (dto.getEmail() != null) {
            profile.setEmail(dto.getEmail());
        }
        if (dto.getPhone() != null) {
            profile.setPhone(dto.getPhone());
        }
        if (dto.getDob() != null) {
            profile.setDob(dto.getDob());
        }
        if (dto.getLinkedin() != null) {
            profile.setLinkedin(dto.getLinkedin());
        }
        if (dto.getInstitute() != null) {
            profile.setInstitute(dto.getInstitute());
        }
        if (dto.getCurrentDegree() != null) {
            profile.setCurrentDegree(dto.getCurrentDegree());
        }
        if (dto.getBranch() != null) {
            profile.setBranch(dto.getBranch());
        }
        if (dto.getYearOfStudy() != null) {
            profile.setYearOfStudy(dto.getYearOfStudy());
        }
        if (dto.getCertifications() != null) {
            profile.setCertifications(dto.getCertifications());
        }
        if (dto.getAchievements() != null) {
            profile.setAchievements(dto.getAchievements());
        }
        if (dto.getTechnicalSkills() != null) {
            profile.setTechnicalSkills(dto.getTechnicalSkills());
        }
        if (dto.getSoftSkills() != null) {
            profile.setSoftSkills(dto.getSoftSkills());
        }
        if (dto.getHobbies() != null) {
            profile.setHobbies(dto.getHobbies());
        }
        if (dto.getInterests() != null) {
            profile.setInterests(dto.getInterests());
        }
        if (dto.getTemplateType() != null) {
            profile.setTemplateType(dto.getTemplateType());
        }
        if (dto.getHiringManagerName() != null) {
            profile.setHiringManagerName(dto.getHiringManagerName());
        }
        if (dto.getCompanyName() != null) {
            profile.setCompanyName(dto.getCompanyName());
        }
        if (dto.getCompanyAddress() != null) {
            profile.setCompanyAddress(dto.getCompanyAddress());
        }
        if (dto.getPositionTitle() != null) {
            profile.setPositionTitle(dto.getPositionTitle());
        }
        if (dto.getRelevantExperience() != null) {
            profile.setRelevantExperience(dto.getRelevantExperience());
        }
        if (dto.getKeyAchievement() != null) {
            profile.setKeyAchievement(dto.getKeyAchievement());
        }
        if (dto.getStrengths() != null) {
            profile.setStrengths(dto.getStrengths());
        }
        if (dto.getClosingNote() != null) {
            profile.setClosingNote(dto.getClosingNote());
        }
        if (dto.getHasInternship() != null) {
            profile.setHasInternship(dto.getHasInternship());
        }
        if (dto.getInternshipDetails() != null) {
            profile.setInternshipDetails(dto.getInternshipDetails());
        }
        if (dto.getHasExperience() != null) {
            profile.setHasExperience(dto.getHasExperience());
        }
        if (dto.getExperienceDetails() != null) {
            profile.setExperienceDetails(dto.getExperienceDetails());
        }
        if (dto.getProfileImage() != null) {
            profile.setProfileImage(dto.getProfileImage());
        }
        if (dto.getAiEnhancedTemplateText() != null) {
            profile.setAiEnhancedTemplateText(dto.getAiEnhancedTemplateText());
        }
    }

    private void validateTemplateType(String templateType, String userId) {
        if (templateType == null || templateType.isBlank()) {
            return;
        }
        String normalized = templateType.trim().toLowerCase();
        boolean exists = templateService.getTemplateByType(normalized, userId).isPresent();
        if (!exists) {
            log.warn("Template type {} not found for userId={}", normalized, userId);
            throw new BadRequestException("Template type '" + normalized + "' is not available");
        }
    }

    private void deleteProfilesByUserId(String userId) {
        try {
            profileRepository.deleteAllByUserId(userId);
        } catch (DataAccessException | MongoException e) {
            log.error("Failed to delete profiles for userId={}: {}", userId, e.getMessage(), e);
            throw new DatabaseConnectionException("Failed to cleanup existing profiles", e);
        }
    }

    /**
     * Keep only the last N profiles for a user, delete older ones
     * @param userId The user ID
     * @param n The number of profiles to keep (default: 3)
     */
    private void keepLastNProfiles(String userId, int n) {
        try {
            List<Profile> allProfiles = profileRepository.findAllByUserId(userId);
            if (allProfiles == null || allProfiles.isEmpty()) {
                return; // No profiles to clean up
            }
            
            log.info("Checking profiles for userId={}: found {} profiles, keeping last {}", userId, allProfiles.size(), n);
            
            // Always sort profiles, regardless of count
            // Sort by createdAt in descending order (newest first)
            // If createdAt is null, use ObjectId as fallback
            allProfiles.sort((p1, p2) -> {
                try {
                    java.time.LocalDateTime date1 = p1 != null ? p1.getCreatedAt() : null;
                    java.time.LocalDateTime date2 = p2 != null ? p2.getCreatedAt() : null;
                    
                    if (date1 != null && date2 != null) {
                        return date2.compareTo(date1); // Descending order (newest first)
                    } else if (date1 != null) {
                        return -1; // p1 has date, p2 doesn't - p1 is newer
                    } else if (date2 != null) {
                        return 1; // p2 has date, p1 doesn't - p2 is newer
                    } else {
                        // Both null, fallback to ObjectId comparison
                        String id1 = p1 != null && p1.getId() != null ? p1.getId() : "";
                        String id2 = p2 != null && p2.getId() != null ? p2.getId() : "";
                        return id2.compareTo(id1);
                    }
                } catch (Exception e) {
                    log.warn("Error comparing profiles: {}", e.getMessage());
                    return 0; // Keep original order on error
                }
            });
            
            // Keep the first N (newest) profiles, delete the rest
            // Changed condition from > n to >= n to ensure we always keep exactly N profiles
            if (allProfiles.size() > n) {
                List<Profile> profilesToDelete = allProfiles.subList(n, allProfiles.size());
                log.info("Deleting {} old profiles for userId={} (keeping last {} profiles)", 
                        profilesToDelete.size(), userId, n);
                for (Profile profile : profilesToDelete) {
                    try {
                        if (profile != null && profile.getId() != null) {
                            profileRepository.deleteById(profile.getId());
                            log.info("Deleted old profile {} for userId={} (keeping last {} profiles)", 
                                    profile.getId(), userId, n);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to delete profile {}: {}", 
                                profile != null ? profile.getId() : "unknown", e.getMessage());
                        // Continue with other deletions
                    }
                }
            } else {
                log.info("No cleanup needed for userId={}: {} profiles (keeping last {})", 
                        userId, allProfiles.size(), n);
            }
        } catch (Exception e) {
            log.error("Failed to cleanup old profiles for userId={}: {}", userId, e.getMessage(), e);
            // Don't throw exception - allow profile creation to continue
            // Just log the error
        }
    }

    @Override
    public List<ProfileResponse> getAllUserProfiles(String userId) {
        ensureUserContext(userId);
        List<Profile> profiles = findProfilesByUserId(userId);
        if (profiles.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Sort by createdAt descending to get newest first
        profiles.sort((p1, p2) -> {
            java.time.LocalDateTime date1 = p1.getCreatedAt();
            java.time.LocalDateTime date2 = p2.getCreatedAt();
            
            if (date1 != null && date2 != null) {
                return date2.compareTo(date1); // Descending order (newest first)
            } else if (date1 != null) {
                return -1;
            } else if (date2 != null) {
                return 1;
            } else {
                // Fallback to ObjectId comparison
                return p2.getId().compareTo(p1.getId());
            }
        });
        
        // Limit to 3 most recent profiles
        List<Profile> recentProfiles = profiles.size() > 3 
            ? profiles.subList(0, 3) 
            : profiles;
        
        // Convert to ProfileResponse list
        List<ProfileResponse> profileResponses = new ArrayList<>();
        for (Profile profile : recentProfiles) {
            TemplateRenderResult renderResult = applyAiOverride(
                    templateFactory.generate(profile.getTemplateType(), profile),
                    profile);
            profileResponses.add(new ProfileResponse(profile, renderResult));
        }
        
        log.info("Retrieved {} profiles for userId={}", profileResponses.size(), userId);
        return profileResponses;
    }

    private Profile persistProfile(Profile profile) {
        try {
            return profileRepository.save(profile);
        } catch (DataAccessException | MongoException e) {
            log.error("Failed to save profile for userId={}: {}", profile.getUserId(), e.getMessage(), e);
            throw new DataSaveException("Failed to save profile", e);
        }
    }

    private Optional<Profile> findProfileByIdAndUser(String id, String userId) {
        try {
            return profileRepository.findByIdAndUserId(id, userId);
        } catch (DataAccessException | MongoException e) {
            log.error("Failed to fetch profile {} for userId={}: {}", id, userId, e.getMessage(), e);
            throw new DatabaseConnectionException("Failed to fetch profile", e);
        }
    }

    private TemplateRenderResult applyAiOverride(TemplateRenderResult renderResult, Profile profile) {
        if (renderResult == null || profile == null) {
            return renderResult;
        }
        String aiText = profile.getAiEnhancedTemplateText();
        if (!StringUtils.hasText(aiText)) {
            return renderResult;
        }
        return new TemplateRenderResult(renderResult.getTemplate(), aiText);
    }

    private String buildRegenerationPrompt(Map<String, Object> formData,
                                           RegenerateProfileRequest request,
                                           String templateSnapshot,
                                           String templateId) {
        StringBuilder builder = new StringBuilder();
        builder.append("You are SaarthiX, an AI that crafts polished profile content. ");
        builder.append("Use the consolidated data to regenerate a final profile paragraph that aligns with template '");
        builder.append(templateId).append("'.\n\n");
        
        // Extract only KEY fields from form data to reduce token count
        builder.append("Key Profile Data:\n");
        builder.append(extractKeyFormData(formData)).append("\n\n");
        
        // Summarize chatbot answers instead of dumping all JSON
        if (request.getChatAnswers() != null && !request.getChatAnswers().isEmpty()) {
            builder.append("CRITICAL: Key Chatbot Insights:\n");
            builder.append(summarizeChatAnswers(request.getChatAnswers())).append("\n");
            builder.append("IMPORTANT: Incorporate these insights into the profile naturally.\n\n");
        }
        
        // Extract only KEY insights from report data
        if (request.getReportData() != null && !request.getReportData().isEmpty()) {
            builder.append("CRITICAL: Evaluation Report Insights:\n");
            builder.append(extractKeyReportData(request.getReportData())).append("\n");
            builder.append("IMPORTANT: Reflect these insights in the profile content.\n\n");
        }
        
        // Truncate template snapshot if it's too long
        if (StringUtils.hasText(templateSnapshot)) {
            String truncatedSnapshot = truncateText(templateSnapshot, 2000); // Max 2000 chars
            builder.append("Current template text (for reference):\n").append(truncatedSnapshot);
            if (truncatedSnapshot.length() < templateSnapshot.length()) {
                builder.append("\n...(truncated for brevity)");
            }
            builder.append("\n\n");
        }
        
        builder.append("INSTRUCTIONS:\n");
        builder.append("- Synthesize ALL sources: profile data, chatbot insights, and evaluation report\n");
        builder.append("- Keep all facts true, do not hallucinate\n");
        builder.append("- Output content that fits directly into the template\n");
        builder.append("- Make the profile comprehensive and insightful\n");
        
        String prompt = builder.toString();
        log.info("Generated regeneration prompt with length: {} characters", prompt.length());
        
        return prompt;
    }
    
    private String extractKeyFormData(Map<String, Object> formData) {
        StringBuilder sb = new StringBuilder();
        String[] keyFields = {"name", "email", "phone", "institute", "currentDegree", "branch", 
                             "yearOfStudy", "technicalSkills", "softSkills", "workExperience",
                             "achievements", "certifications", "interests", "hobbies"};
        
        for (String field : keyFields) {
            Object value = formData.get(field);
            if (value != null && !value.toString().isEmpty()) {
                String val = value.toString();
                // Truncate long values
                if (val.length() > 500) {
                    val = val.substring(0, 500) + "...";
                }
                sb.append("- ").append(field).append(": ").append(val).append("\n");
            }
        }
        return sb.toString();
    }
    
    private String summarizeChatAnswers(Map<String, Object> chatAnswers) {
        StringBuilder sb = new StringBuilder();
        int count = 0;
        for (Map.Entry<String, Object> entry : chatAnswers.entrySet()) {
            if (count >= 10) break; // Limit to first 10 Q&A pairs
            String question = truncateText(entry.getKey(), 150);
            String answer = truncateText(entry.getValue().toString(), 200);
            sb.append("Q").append(count + 1).append(": ").append(question).append("\n");
            sb.append("A: ").append(answer).append("\n");
            count++;
        }
        if (chatAnswers.size() > 10) {
            sb.append("...(").append(chatAnswers.size() - 10).append(" more Q&A pairs omitted)\n");
        }
        return sb.toString();
    }
    
    private String extractKeyReportData(Map<String, Object> reportData) {
        StringBuilder sb = new StringBuilder();
        String[] keyFields = {"summary", "interest_persona", "strengths", "recommended_roles", 
                             "dos", "roadmap_90_days"};
        
        for (String field : keyFields) {
            Object value = reportData.get(field);
            if (value != null) {
                String val = value.toString();
                // Truncate long values
                if (val.length() > 300) {
                    val = val.substring(0, 300) + "...";
                }
                sb.append("- ").append(field).append(": ").append(val).append("\n");
            }
        }
        return sb.toString();
    }
    
    private String truncateText(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    }

    private String safeToJson(Object source) {
        if (source == null) {
            return "";
        }
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(source);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize data for regeneration prompt: {}", e.getMessage());
            return source.toString();
        }
    }

    private Map<String, Object> sanitizeForModel(Map<String, Object> source) {
        if (source == null) {
            return Map.of();
        }
        Map<String, Object> sanitized = new LinkedHashMap<>();
        source.forEach((key, value) -> {
            if (key == null || value == null) {
                return;
            }
            Object normalized = value;
            if (value instanceof Collection<?>) {
                normalized = ((Collection<?>) value).stream()
                        .map(Object::toString)
                        .collect(Collectors.joining(", "));
            } else if (value.getClass().isArray()) {
                normalized = String.join(", ", Arrays.stream((Object[]) value)
                        .map(Object::toString)
                        .toArray(String[]::new));
            }
            sanitized.put(key, normalized);
        });
        return sanitized;
    }

    private List<Profile> findProfilesByUserId(String userId) {
        try {
            return profileRepository.findAllByUserId(userId);
        } catch (DataAccessException | MongoException e) {
            log.error("Failed to fetch profiles for userId={}: {}", userId, e.getMessage(), e);
            throw new DatabaseConnectionException("Failed to fetch profiles", e);
        }
    }

    private void ensureUserContext(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new UnauthorizedException("User context is required");
        }
    }

    @Override
    public ProfileResponse enhanceProfileWithReport(EnhanceProfileRequest request, String userId) {
        ensureUserContext(userId);

        if (request == null) {
            throw new BadRequestException("Enhancement request cannot be null");
        }

        Profile profile = request.getProfileData();
        Map<String, Object> reportData = request.getReportData();

        if (profile == null) {
            throw new BadRequestException("Profile data cannot be null");
        }

        if (reportData == null || reportData.isEmpty()) {
            throw new BadRequestException("Report data cannot be null or empty");
        }

        // Set userId if not already set
        if (profile.getUserId() == null) {
            profile.setUserId(userId);
        }

        // Validate that the profile belongs to the user if it has an ID
        if (profile.getId() != null && !userId.equals(profile.getUserId())) {
            throw new UnauthorizedException("Cannot enhance another user's profile");
        }

        log.info("Enhancing profile with report data for userId={}", userId);

        try {
            // Get the existing profile to enhance or use the provided one
            Profile profileToEnhance;
            if (profile.getId() != null) {
                Optional<Profile> existingProfile = findProfileByIdAndUser(profile.getId(), userId);
                if (existingProfile.isPresent()) {
                    profileToEnhance = existingProfile.get();
                    // Update basic fields from request if they differ
                    updateProfileFieldsFromRequest(profileToEnhance, profile);
                } else {
                    profileToEnhance = profile;
                }
            } else {
                profileToEnhance = profile;
            }

            // Generate the enhanced template text using AI (First Pass - with report insights)
            String enhancedText = generateEnhancedProfileText(profileToEnhance, reportData);
            
            log.info("First AI enhancement completed for userId={}", userId);
            
            // Perform second AI enhancement pass for better quality and refinement
            String secondPassEnhancedText = performSecondPassEnhancement(enhancedText, profileToEnhance);
            
            log.info("Second AI enhancement pass completed for userId={}", userId);
            
            // Set the final enhanced text
            profileToEnhance.setAiEnhancedTemplateText(secondPassEnhancedText);

            // Save the enhanced profile
            Profile savedProfile = persistProfile(profileToEnhance);

            // Generate template render result
            TemplateRenderResult renderResult = generateTemplate(savedProfile);

            log.info("Profile enhanced successfully with dual AI passes for userId={} profileId={}", userId, savedProfile.getId());
            return new ProfileResponse(savedProfile, renderResult);

        } catch (Exception e) {
            log.error("Failed to enhance profile for userId={}: {}", userId, e.getMessage(), e);
            throw new DataSaveException("Failed to enhance profile: " + e.getMessage(), e);
        }
    }

    private String generateEnhancedProfileText(Profile profile, Map<String, Object> reportData) {
        // Build the enhancement prompt
        String currentTemplate = "";
        if (StringUtils.hasText(profile.getAiEnhancedTemplateText())) {
            currentTemplate = profile.getAiEnhancedTemplateText();
        } else {
            TemplateRenderResult baseRender = templateFactory.generate(
                profile.getTemplateType(), profile);
            currentTemplate = baseRender.getRenderedText();
        }

        // Extract key insights from report
        String reportInsights = extractReportInsights(reportData);

        // Build the AI prompt
        String prompt = buildEnhancementPrompt(currentTemplate, reportInsights, profile);

        // Call OpenAI using the raw prompt (avoid double-wrapping prompts)
        String enhanced = openAIService.completePrompt(prompt, 1400, 0.6);

        // Safety: enforce <= 10% word growth vs original template (text-only, ignore HTML tags).
        int baseWords = countWords(stripHtml(currentTemplate));
        int maxWords = (int) Math.ceil(baseWords * 1.10);
        if (baseWords > 0 && countWords(stripHtml(enhanced)) > maxWords) {
            String shortenPrompt = buildShortenToWordLimitPrompt(currentTemplate, enhanced, maxWords);
            enhanced = openAIService.completePrompt(shortenPrompt, 1200, 0.4);
        }

        return enhanced;
    }

    private String extractReportInsights(Map<String, Object> reportData) {
        StringBuilder insights = new StringBuilder();

        // Extract strengths from SWOT analysis
        Object strengthsObj = reportData.get("strengths");
        if (strengthsObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> strengths = (List<String>) strengthsObj;
            if (!strengths.isEmpty()) {
                insights.append("STRENGTHS from Psychometric Assessment:\n");
                strengths.forEach(s -> insights.append("- ").append(s).append("\n"));
                insights.append("\n");
            }
        }

        // Extract Fit Analysis
        Object fitAnalysisObj = reportData.get("fitAnalysis");
        if (fitAnalysisObj instanceof String) {
            String fitAnalysis = (String) fitAnalysisObj;
            if (fitAnalysis != null && !fitAnalysis.trim().isEmpty()) {
                insights.append("FIT ANALYSIS:\n");
                insights.append(fitAnalysis.trim()).append("\n\n");
            }
        }

        // Extract Behavioral Insights
        Object behavioralInsightsObj = reportData.get("behavioralInsights");
        if (behavioralInsightsObj instanceof String) {
            String behavioralInsights = (String) behavioralInsightsObj;
            if (behavioralInsights != null && !behavioralInsights.trim().isEmpty()) {
                insights.append("BEHAVIORAL INSIGHTS:\n");
                insights.append(behavioralInsights.trim()).append("\n\n");
            }
        }

        // Extract Domain Insights
        Object domainInsightsObj = reportData.get("domainInsights");
        if (domainInsightsObj instanceof String) {
            String domainInsights = (String) domainInsightsObj;
            if (domainInsights != null && !domainInsights.trim().isEmpty()) {
                insights.append("DOMAIN INSIGHTS:\n");
                insights.append(domainInsights.trim()).append("\n\n");
            }
        }

        return insights.toString();
    }

    private String buildEnhancementPrompt(String currentTemplate, String reportInsights, Profile profile) {
        int baseWords = countWords(stripHtml(currentTemplate));
        int maxWords = (int) Math.ceil(baseWords * 1.10);
        return String.format(
            "You are a professional profile enhancement expert. Your task is to intelligently enhance the following profile " +
            "by incorporating positive insights from a comprehensive psychometric assessment.\n\n" +
            "CURRENT PROFILE:\n%s\n\n" +
            "PSYCHOMETRIC ASSESSMENT INSIGHTS:\n%s\n\n" +
            "CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:\n" +
            "1. MAINTAIN STRUCTURE: Keep the profile's exact structure, format, design, and layout unchanged\n" +
            "   - If the current profile is HTML or templated text, you MUST preserve the same tags/line breaks/ordering\n" +
            "2. UPDATE CONTENT: Enhance and improve the existing content by weaving in positive insights from:\n" +
            "   - Key Strengths (select 2-3 most impactful ones)\n" +
            "   - Fit Analysis (positive career alignment points)\n" +
            "   - Behavioral Insights (positive personality traits and work behaviors)\n" +
            "   - Domain Insights (positive signals about domain readiness and technical alignment)\n" +
            "3. NATURAL INTEGRATION: Blend these insights naturally into existing sections - do NOT create new sections\n" +
            "4. SELECTIVE ADDITION: Only add insights that are NOT already mentioned or clearly implied in the profile\n" +
            "5. PRESERVE FACTUALS: Do NOT change any factual information (name, education, dates, contact details, experience, etc.)\n" +
            "6. IMPROVE EXISTING: Enhance descriptions of skills, experiences, and qualities with positive assessment insights\n" +
            "7. POSITIVE FOCUS: Only use positive and constructive information - ignore any negative aspects\n" +
            "8. PROFESSIONAL TONE: Maintain the professional voice and writing style of the original profile\n" +
            "9. SUBTLE ENHANCEMENT: The enhancement should feel natural and not forced or obvious\n" +
            "10. LENGTH CAP: Do NOT increase the word count by more than 10%%.\n" +
            "    - Original has ~%d words (text-only).\n" +
            "    - Output MUST be <= %d words (text-only).\n" +
            "10. NO META CONTENT: Return ONLY the enhanced profile text without any commentary, explanations, or notes\n\n" +
            "KEY GOAL: Enrich the profile content with psychometric insights while keeping its structure and design identical.\n\n" +
            "ENHANCED PROFILE:",
            currentTemplate,
            reportInsights,
            baseWords,
            maxWords
        );
    }

    /**
     * Performs a second pass AI enhancement to refine and polish the profile text
     * This adds professional depth and ensures the profile is production-ready
     */
    private String performSecondPassEnhancement(String firstPassEnhancedText, Profile profile) {
        int baseWords = countWords(stripHtml(firstPassEnhancedText));
        int maxWords = (int) Math.ceil(baseWords * 1.10);
        String secondPassPrompt = String.format(
            "You are a professional profile refinement expert. Your task is to perform a final quality enhancement " +
            "on the following profile to ensure it is polished, professional, and impactful.\n\n" +
            "PROFILE TO REFINE:\n%s\n\n" +
            "REFINEMENT INSTRUCTIONS:\n" +
            "1. PRESERVE STRUCTURE: Keep the exact structure, format, layout, and design completely unchanged\n" +
            "2. IMPROVE LANGUAGE: Enhance language to be more compelling, action-oriented, and professional\n" +
            "3. ENSURE CONSISTENCY: Maintain consistent professional tone throughout the profile\n" +
            "4. FIX ISSUES: Correct any grammatical issues, awkward phrasing, or redundancies\n" +
            "5. OPTIMIZE FLOW: Improve sentence structure for better readability and impact\n" +
            "6. COHESIVE STORY: Ensure the profile tells a compelling and cohesive professional narrative\n" +
            "7. PRESERVE FACTS: Keep ALL factual information, names, dates, and specific details EXACTLY as they are\n" +
            "8. SUBTLE REFINEMENT: This is polish and refinement, NOT rewriting or restructuring\n" +
            "9. NO STRUCTURAL CHANGES: Do NOT add, remove, or reorganize sections or paragraphs\n" +
            "10. LENGTH CAP: Do NOT increase the word count by more than 10%% (text-only). Keep it <= %d words.\n" +
            "10. NO META CONTENT: Return ONLY the refined profile text without commentary or explanations\n\n" +
            "KEY GOAL: Polish the content while keeping structure, design, and factual information identical.\n\n" +
            "REFINED PROFILE:",
            firstPassEnhancedText,
            maxWords
        );

        String refined = openAIService.completePrompt(secondPassPrompt, 1400, 0.4);
        if (baseWords > 0 && countWords(stripHtml(refined)) > maxWords) {
            String shortenPrompt = buildShortenToWordLimitPrompt(firstPassEnhancedText, refined, maxWords);
            refined = openAIService.completePrompt(shortenPrompt, 1200, 0.3);
        }
        return refined;
    }

    private String stripHtml(String input) {
        if (input == null) return "";
        return input.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
    }

    private int countWords(String input) {
        if (input == null) return 0;
        String t = input.trim();
        if (t.isEmpty()) return 0;
        return t.split("\\s+").length;
    }

    private String buildShortenToWordLimitPrompt(String originalTemplate, String candidateText, int maxWords) {
        return String.format(
            "You are an expert editor.\n\n" +
            "TASK:\n" +
            "- Rewrite the CANDIDATE PROFILE to fit the word limit, while preserving the EXACT structure/design of the ORIGINAL PROFILE.\n" +
            "- Keep ALL HTML/tags/line breaks/order consistent with the ORIGINAL PROFILE.\n" +
            "- Do NOT add new sections.\n\n" +
            "WORD LIMIT:\n" +
            "- Output must be <= %d words (text-only, tags ignored).\n\n" +
            "ORIGINAL PROFILE (structure to preserve):\n%s\n\n" +
            "CANDIDATE PROFILE (needs shortening):\n%s\n\n" +
            "OUTPUT ONLY the shortened profile:",
            maxWords,
            originalTemplate == null ? "" : originalTemplate,
            candidateText == null ? "" : candidateText
        );
    }

    private void updateProfileFieldsFromRequest(Profile existing, Profile request) {
        // Only update non-null fields from request
        if (request.getName() != null) existing.setName(request.getName());
        if (request.getEmail() != null) existing.setEmail(request.getEmail());
        if (request.getPhone() != null) existing.setPhone(request.getPhone());
        if (request.getCurrentDegree() != null) existing.setCurrentDegree(request.getCurrentDegree());
        if (request.getInstitute() != null) existing.setInstitute(request.getInstitute());
        if (request.getBranch() != null) existing.setBranch(request.getBranch());
        if (request.getTechnicalSkills() != null) existing.setTechnicalSkills(request.getTechnicalSkills());
        if (request.getSoftSkills() != null) existing.setSoftSkills(request.getSoftSkills());
        if (request.getHobbies() != null) existing.setHobbies(request.getHobbies());
        if (request.getInterests() != null) existing.setInterests(request.getInterests());
        if (request.getCertifications() != null) existing.setCertifications(request.getCertifications());
        if (request.getAchievements() != null) existing.setAchievements(request.getAchievements());
    }
}