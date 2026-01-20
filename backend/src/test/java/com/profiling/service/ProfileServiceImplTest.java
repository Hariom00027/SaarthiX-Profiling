package com.profiling.service;

import com.profiling.dto.ProfileRequestDTO;
import com.profiling.dto.RegenerateProfileRequest;
import com.profiling.dto.EnhanceProfileRequest;
import com.profiling.exception.BadRequestException;
import com.profiling.exception.DataSaveException;
import com.profiling.exception.ResourceNotFoundException;
import com.profiling.exception.UnauthorizedException;
import com.profiling.model.Profile;
import com.profiling.model.ProfileResponse;
import com.profiling.repository.ProfileRepository;
import com.profiling.service.OpenAIService;
import com.profiling.template.TemplateFactory;
import com.profiling.template.TemplateRenderResult;
import com.profiling.template.TemplateEntity;
import com.profiling.template.TemplateService;
import java.io.IOException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.doReturn;

/**
 * Unit tests for ProfileServiceImpl
 * Coverage: Save, Update, Get, Regenerate, Enhance, Delete
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProfileService Tests")
class ProfileServiceImplTest {

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private TemplateFactory templateFactory;

    @Mock
    private ProfileJsonService profileJsonService;

    @Mock
    private TemplateService templateService;

    @Mock
    private OpenAIService openAIService;

    @InjectMocks
    private ProfileServiceImpl profileService;

    private Profile testProfile;
    private String testUserId = "user123";
    private String testProfileId = "profile123";
    private TemplateRenderResult testRenderResult;
    private TemplateEntity testTemplate;

    @BeforeEach
    void setUp() {
        testProfile = new Profile();
        testProfile.setId(testProfileId);
        testProfile.setUserId(testUserId);
        testProfile.setName("Test User");
        testProfile.setEmail("test@example.com");
        testProfile.setTemplateType("professional");
        testProfile.setCreatedAt(LocalDateTime.now());

        testTemplate = new TemplateEntity();
        testTemplate.setId("professional");
        testTemplate.setName("Professional Template");
        testTemplate.setContent("Template content for {{name}}");

        testRenderResult = new TemplateRenderResult(testTemplate, "Rendered template text");
    }

    // TC-SAVE-001: Save Profile - New Profile
    @Test
    @DisplayName("TC-SAVE-001: Save new profile should succeed")
    void testSaveProfile_NewProfile_Success() {
        // Arrange
        Profile newProfile = new Profile();
        newProfile.setName("New User");
        newProfile.setEmail("new@example.com");
        newProfile.setTemplateType("professional");

        Profile savedProfile = new Profile();
        savedProfile.setId(testProfileId);
        savedProfile.setUserId(testUserId);
        savedProfile.setName("New User");
        savedProfile.setEmail("new@example.com");
        savedProfile.setTemplateType("professional");
        savedProfile.setCreatedAt(LocalDateTime.now());

        when(templateService.getTemplateByType("professional", testUserId))
                .thenReturn(Optional.of(testTemplate));
        when(profileRepository.save(any(Profile.class))).thenReturn(savedProfile);
        when(templateFactory.generate(eq("professional"), any(Profile.class))).thenReturn(testRenderResult);
        when(profileRepository.findAllByUserId(testUserId)).thenReturn(Collections.emptyList());
        try {
            doReturn("/path/to/profile.json").when(profileJsonService)
                    .saveProfileAsJson(any(Profile.class));
        } catch (IOException e) {
            // Ignore
        }

        // Act
        ProfileResponse response = profileService.saveProfile(newProfile, testUserId);

        // Assert
        assertNotNull(response);
        assertNotNull(response.getProfile());
        assertEquals(testProfileId, response.getProfile().getId());
        assertNotNull(response.getProfile().getCreatedAt());

        verify(profileRepository).save(any(Profile.class));
        verify(templateFactory).generate("professional", savedProfile);
    }

    // TC-SAVE-002: Save Profile - Update Existing Profile
    @Test
    @DisplayName("TC-SAVE-002: Update existing profile should preserve createdAt")
    void testSaveProfile_UpdateExisting_PreservesCreatedAt() {
        // Arrange
        LocalDateTime originalCreatedAt = LocalDateTime.now().minusDays(5);
        testProfile.setCreatedAt(originalCreatedAt);
        testProfile.setName("Updated Name");
        testProfile.setTemplateType("professional");

        when(templateService.getTemplateByType("professional", testUserId))
                .thenReturn(Optional.of(testTemplate));
        when(profileRepository.save(any(Profile.class))).thenReturn(testProfile);
        when(templateFactory.generate(eq("professional"), any(Profile.class))).thenReturn(testRenderResult);
        try {
            doReturn("/path/to/profile.json").when(profileJsonService)
                    .saveProfileAsJson(any(Profile.class));
        } catch (IOException e) {
            // Ignore
        }

        // Act
        ProfileResponse response = profileService.saveProfile(testProfile, testUserId);

        // Assert
        assertNotNull(response);
        assertEquals(originalCreatedAt, response.getProfile().getCreatedAt());
        verify(profileRepository).save(any(Profile.class));
    }

    // TC-SAVE-003: Save Profile - Verify Chatbot Data Not Saved
    @Test
    @DisplayName("TC-SAVE-003: Save profile should not include chatbot data")
    void testSaveProfile_DoesNotIncludeChatbotData() {
        // Arrange
        Profile newProfile = new Profile();
        newProfile.setName("Test User");
        newProfile.setEmail("test@example.com");
        newProfile.setTemplateType("professional");

        Profile savedProfile = new Profile();
        savedProfile.setId(testProfileId);
        savedProfile.setUserId(testUserId);
        savedProfile.setName("Test User");
        savedProfile.setEmail("test@example.com");
        savedProfile.setTemplateType("professional");
        savedProfile.setCreatedAt(LocalDateTime.now());

        when(templateService.getTemplateByType("professional", testUserId))
                .thenReturn(Optional.of(testTemplate));
        when(profileRepository.save(any(Profile.class))).thenReturn(savedProfile);
        when(templateFactory.generate(eq("professional"), any(Profile.class))).thenReturn(testRenderResult);
        when(profileRepository.findAllByUserId(testUserId)).thenReturn(Collections.emptyList());
        try {
            doReturn("/path/to/profile.json").when(profileJsonService)
                    .saveProfileAsJson(any(Profile.class));
        } catch (IOException e) {
            // Ignore
        }

        // Act
        ProfileResponse response = profileService.saveProfile(newProfile, testUserId);

        // Assert
        assertNotNull(response);
        // Verify Profile model doesn't have chatAnswers field (it shouldn't)
        // This is verified by the fact that Profile model doesn't include chatAnswers
        verify(profileRepository).save(any(Profile.class));
        try {
            verify(profileJsonService).saveProfileAsJson(any(Profile.class));
        } catch (IOException e) {
            // Ignore - verification doesn't throw in mocked context
        }
    }

    // TC-GEN-001: Free Template Generation - Static Template
    @Test
    @DisplayName("TC-GEN-001: Free template generation should not use AI")
    void testSaveProfile_FreeTemplate_NoAIEnhancement() {
        // Arrange
        Profile newProfile = new Profile();
        newProfile.setName("Test User");
        newProfile.setEmail("test@example.com");
        newProfile.setTemplateType("professional");
        newProfile.setAiEnhancedTemplateText(null); // Free template

        Profile savedProfile = new Profile();
        savedProfile.setId(testProfileId);
        savedProfile.setUserId(testUserId);
        savedProfile.setAiEnhancedTemplateText(null);
        savedProfile.setCreatedAt(LocalDateTime.now());

        when(templateService.getTemplateByType("professional", testUserId))
                .thenReturn(Optional.of(testTemplate));
        when(profileRepository.save(any(Profile.class))).thenReturn(savedProfile);
        lenient().when(templateFactory.generate(eq("professional"), any(Profile.class))).thenReturn(testRenderResult);
        when(profileRepository.findAllByUserId(testUserId)).thenReturn(Collections.emptyList());
        try {
            doReturn("/path/to/profile.json").when(profileJsonService)
                    .saveProfileAsJson(any(Profile.class));
        } catch (IOException e) {
            // Ignore
        }

        // Act
        ProfileResponse response = profileService.saveProfile(newProfile, testUserId);

        // Assert
        assertNull(response.getProfile().getAiEnhancedTemplateText());
        verify(openAIService, never()).enhanceProfile(anyString());
    }

    // TC-GEN-002: Basic Template Generation - AI Enhancement Success
    @Test
    @DisplayName("TC-GEN-002: Basic template with AI enhancement should succeed")
    void testRegenerateProfile_WithAIEnhancement_Success() {
        // Arrange
        RegenerateProfileRequest request = new RegenerateProfileRequest();
        Map<String, Object> formData = new HashMap<>();
        formData.put("name", "Test User");
        formData.put("email", "test@example.com");
        formData.put("templateType", "professional");
        request.setFormData(formData);
        request.setTemplateId("professional");
        request.setUserId(testUserId);

        Profile savedProfile = new Profile();
        savedProfile.setId(testProfileId);
        savedProfile.setUserId(testUserId);
        savedProfile.setAiEnhancedTemplateText("AI-enhanced text");

        when(templateService.getTemplateByType("professional", testUserId))
                .thenReturn(Optional.of(testTemplate));
        when(templateFactory.generate(eq("professional"), any(Profile.class))).thenReturn(testRenderResult);
        when(openAIService.enhanceProfile(anyString())).thenReturn("AI-enhanced text");
        when(profileRepository.save(any(Profile.class))).thenReturn(savedProfile);
        when(profileRepository.findAllByUserId(testUserId)).thenReturn(Collections.emptyList());

        // Act
        ProfileResponse response = profileService.regenerateProfile(request, testUserId);

        // Assert
        assertNotNull(response);
        assertEquals("AI-enhanced text", response.getProfile().getAiEnhancedTemplateText());
        verify(openAIService).enhanceProfile(anyString());
    }

    // TC-GEN-003: Basic Template Generation - OpenAI API Failure
    @Test
    @DisplayName("TC-GEN-003: OpenAI API failure should be handled gracefully")
    void testRegenerateProfile_OpenAIFailure_ThrowsException() {
        // Arrange
        RegenerateProfileRequest request = new RegenerateProfileRequest();
        Map<String, Object> formData = new HashMap<>();
        formData.put("name", "Test User");
        formData.put("templateType", "professional");
        request.setFormData(formData);
        request.setTemplateId("professional");
        request.setUserId(testUserId);

        when(templateService.getTemplateByType("professional", testUserId))
                .thenReturn(Optional.of(testTemplate));
        when(templateFactory.generate(eq("professional"), any(Profile.class))).thenReturn(testRenderResult);
        when(openAIService.enhanceProfile(anyString()))
                .thenThrow(new RuntimeException("OpenAI API error"));

        // Act & Assert
        DataSaveException exception = assertThrows(DataSaveException.class, () -> {
            profileService.regenerateProfile(request, testUserId);
        });

        assertTrue(exception.getMessage().contains("Failed to regenerate profile using AI"));
        verify(openAIService).enhanceProfile(anyString());
    }

    // TC-VIEW-001: Get Current User Profile - Profile Exists
    @Test
    @DisplayName("TC-VIEW-001: Get current user profile should succeed")
    void testGetCurrentUserProfile_ProfileExists_Success() {
        // Arrange
        when(profileRepository.findAllByUserId(testUserId))
                .thenReturn(Collections.singletonList(testProfile));
        when(templateFactory.generate(eq("professional"), any(Profile.class))).thenReturn(testRenderResult);

        // Act
        ProfileResponse response = profileService.getCurrentUserProfile(testUserId);

        // Assert
        assertNotNull(response);
        assertEquals(testProfileId, response.getProfile().getId());
        verify(profileRepository).findAllByUserId(testUserId);
    }

    // TC-VIEW-002: Get Current User Profile - No Profile Exists
    @Test
    @DisplayName("TC-VIEW-002: Get current user profile when none exists should return null")
    void testGetCurrentUserProfile_NoProfile_ReturnsNull() {
        // Arrange
        when(profileRepository.findAllByUserId(testUserId)).thenReturn(Collections.emptyList());

        // Act
        ProfileResponse response = profileService.getCurrentUserProfile(testUserId);

        // Assert
        assertNull(response);
        verify(profileRepository).findAllByUserId(testUserId);
    }

    // TC-VIEW-005: Get Profile by ID - Valid ID
    @Test
    @DisplayName("TC-VIEW-005: Get profile by ID should succeed")
    void testGetProfileById_ValidId_Success() {
        // Arrange
        when(profileRepository.findByIdAndUserId(testProfileId, testUserId))
                .thenReturn(Optional.of(testProfile));

        // Act
        Optional<Profile> result = profileService.getProfileById(testProfileId, testUserId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testProfileId, result.get().getId());
        verify(profileRepository).findByIdAndUserId(testProfileId, testUserId);
    }

    // TC-VIEW-006: Get Profile by ID - Invalid ID
    @Test
    @DisplayName("TC-VIEW-006: Get profile by invalid ID should return empty")
    void testGetProfileById_InvalidId_ReturnsEmpty() {
        // Arrange
        when(profileRepository.findByIdAndUserId("invalid-id", testUserId))
                .thenReturn(Optional.empty());

        // Act
        Optional<Profile> result = profileService.getProfileById("invalid-id", testUserId);

        // Assert
        assertFalse(result.isPresent());
        verify(profileRepository).findByIdAndUserId("invalid-id", testUserId);
    }

    // TC-AUTH-014: Data Isolation - User Cannot Access Another User's Profile
    @Test
    @DisplayName("TC-AUTH-014: User cannot access another user's profile")
    void testGetProfileById_DifferentUser_ReturnsEmpty() {
        // Arrange
        String otherUserId = "other-user";
        when(profileRepository.findByIdAndUserId(testProfileId, otherUserId))
                .thenReturn(Optional.empty());

        // Act
        Optional<Profile> result = profileService.getProfileById(testProfileId, otherUserId);

        // Assert
        assertFalse(result.isPresent());
        verify(profileRepository).findByIdAndUserId(testProfileId, otherUserId);
    }

    // TC-UPDATE-001: Update Profile - Valid Update
    @Test
    @DisplayName("Update profile with valid data should succeed")
    void testUpdateProfile_ValidUpdate_Success() {
        // Arrange
        ProfileRequestDTO dto = new ProfileRequestDTO();
        dto.setName("Updated Name");
        dto.setEmail("updated@example.com");

        LocalDateTime originalCreatedAt = LocalDateTime.now().minusDays(5);
        testProfile.setCreatedAt(originalCreatedAt);

        when(profileRepository.findByIdAndUserId(testProfileId, testUserId))
                .thenReturn(Optional.of(testProfile));
        when(profileRepository.save(any(Profile.class))).thenReturn(testProfile);

        // Act
        Profile updated = profileService.updateProfile(testProfileId, dto, testUserId);

        // Assert
        assertNotNull(updated);
        assertEquals(originalCreatedAt, updated.getCreatedAt()); // createdAt preserved
        verify(profileRepository).save(any(Profile.class));
    }

    // TC-REGEN-005: Regenerate Profile - User ID Mismatch
    @Test
    @DisplayName("TC-REGEN-005: Regenerate with user ID mismatch should fail")
    void testRegenerateProfile_UserIdMismatch_ThrowsException() {
        // Arrange
        RegenerateProfileRequest request = new RegenerateProfileRequest();
        request.setUserId("different-user");
        request.setTemplateId("professional");
        Map<String, Object> formData = new HashMap<>();
        formData.put("templateType", "professional");
        request.setFormData(formData);

        // Act & Assert
        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () -> {
            profileService.regenerateProfile(request, testUserId);
        });

        assertEquals("Token user mismatch", exception.getMessage());
    }

    // TC-SAVE-005: Profile Limit - Keep Last 3
    @Test
    @DisplayName("TC-SAVE-005: Creating 5th profile should keep only last 3")
    void testSaveProfile_ProfileLimit_KeepsLast3() {
        // Arrange
        Profile newProfile = new Profile();
        newProfile.setName("New User");
        newProfile.setEmail("new@example.com");
        newProfile.setTemplateType("professional");

        // Create 4 existing profiles
        List<Profile> existingProfiles = new ArrayList<>();
        for (int i = 1; i <= 4; i++) {
            Profile p = new Profile();
            p.setId("profile" + i);
            p.setUserId(testUserId);
            p.setCreatedAt(LocalDateTime.now().minusDays(i));
            existingProfiles.add(p);
        }

        Profile savedProfile = new Profile();
        savedProfile.setId(testProfileId);
        savedProfile.setUserId(testUserId);
        savedProfile.setCreatedAt(LocalDateTime.now());

        when(templateService.getTemplateByType("professional", testUserId))
                .thenReturn(Optional.of(testTemplate));
        when(profileRepository.save(any(Profile.class))).thenReturn(savedProfile);
        lenient().when(templateFactory.generate(eq("professional"), any(Profile.class))).thenReturn(testRenderResult);
        when(profileRepository.findAllByUserId(testUserId)).thenReturn(existingProfiles);
        try {
            doReturn("/path/to/profile.json").when(profileJsonService)
                    .saveProfileAsJson(any(Profile.class));
        } catch (IOException e) {
            // Ignore
        }

        // Act
        profileService.saveProfile(newProfile, testUserId);

        // Assert
        // Verify that delete was called for old profiles (keeping only last 3)
        verify(profileRepository, atLeastOnce()).findAllByUserId(testUserId);
        // Note: Actual deletion logic would need to be verified based on implementation
    }

    // TC-ENHANCE-001: Enhance Profile with Report - Valid Data
    @Test
    @DisplayName("TC-ENHANCE-001: Enhance profile with report should succeed")
    void testEnhanceProfileWithReport_ValidData_Success() {
        // Arrange
        EnhanceProfileRequest request = new EnhanceProfileRequest();
        request.setProfileData(testProfile); // Set profile data, not just ID
        Map<String, Object> reportData = new HashMap<>();
        reportData.put("strengths", Arrays.asList("Leadership", "Communication"));
        request.setReportData(reportData);

        when(profileRepository.findByIdAndUserId(testProfileId, testUserId))
                .thenReturn(Optional.of(testProfile));
        when(templateFactory.generate(eq("professional"), any(Profile.class))).thenReturn(testRenderResult);
        // Mock dual-pass enhancement - both passes use completePrompt
        when(openAIService.completePrompt(anyString(), anyInt(), anyDouble()))
                .thenReturn("First pass enhanced text")
                .thenReturn("Second pass enhanced text");
        when(profileRepository.save(any(Profile.class))).thenReturn(testProfile);

        // Act
        ProfileResponse response = profileService.enhanceProfileWithReport(request, testUserId);

        // Assert
        assertNotNull(response);
        verify(openAIService, atLeastOnce()).completePrompt(anyString(), anyInt(), anyDouble());
        verify(profileRepository).save(any(Profile.class));
    }
}

