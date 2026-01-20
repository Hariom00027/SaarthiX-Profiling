package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.ProfileRequestDTO;
import com.profiling.dto.EnhanceProfileRequest;
import com.profiling.exception.BadRequestException;
import com.profiling.exception.UnauthorizedException;
import com.profiling.model.Profile;
import com.profiling.model.ProfileResponse;
import com.profiling.security.SecurityUtils;
import com.profiling.service.PDFService;
import com.profiling.service.ProfileService;
import com.profiling.service.OpenAIService;
import com.profiling.service.ResumeParserService;
import com.profiling.template.TemplateRenderResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Integration tests for ProfileController
 * Coverage: All endpoints, error handling, authorization
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProfileController Tests")
class ProfileControllerTest {

    @Mock
    private ProfileService profileService;

    @Mock
    private PDFService pdfService;

    @Mock
    private ResumeParserService resumeParserService;

    @Mock
    private OpenAIService openAIService;

    @InjectMocks
    private ProfileController profileController;

    private Profile testProfile;
    private String testUserId = "user123";
    private String testProfileId = "profile123";
    private ProfileResponse testProfileResponse;

    @BeforeEach
    void setUp() {
        testProfile = new Profile();
        testProfile.setId(testProfileId);
        testProfile.setUserId(testUserId);
        testProfile.setName("Test User");
        testProfile.setEmail("test@example.com");

        testProfileResponse = new ProfileResponse(testProfile, 
                new TemplateRenderResult(null, "Template text"));
    }

    // TC-SAVE-001: Save Profile - New Profile
    @Test
    @DisplayName("TC-SAVE-001: Create profile should succeed")
    void testCreateProfile_Success() {
        // Arrange
        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(testUserId);
            when(profileService.saveProfile(any(Profile.class), eq(testUserId)))
                    .thenReturn(testProfileResponse);

            // Act
            ResponseEntity<ApiResponse> response = profileController.createProfile(testProfile);

            // Assert
            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("Profile created successfully", response.getBody().getMessage());
            verify(profileService).saveProfile(any(Profile.class), eq(testUserId));
        }
    }

    // TC-AUTH-011: JWT Token Validation - Missing Token
    @Test
    @DisplayName("TC-AUTH-011: Create profile without authentication should fail")
    void testCreateProfile_Unauthenticated_ThrowsException() {
        // Arrange
        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(null);

            // Act & Assert
            UnauthorizedException exception = assertThrows(UnauthorizedException.class, () -> {
                profileController.createProfile(testProfile);
            });

            assertEquals("User must be authenticated", exception.getMessage());
            verify(profileService, never()).saveProfile(any(), any());
        }
    }

    // TC-VIEW-001: Get Current User Profile - Profile Exists
    @Test
    @DisplayName("TC-VIEW-001: Get my profile should succeed")
    void testGetMyProfile_Success() {
        // Arrange
        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(testUserId);
            when(profileService.getCurrentUserProfile(testUserId))
                    .thenReturn(testProfileResponse);

            // Act
            ResponseEntity<ApiResponse> response = profileController.getMyProfile();

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            verify(profileService).getCurrentUserProfile(testUserId);
        }
    }

    // TC-VIEW-002: Get Current User Profile - No Profile Exists
    @Test
    @DisplayName("TC-VIEW-002: Get my profile when none exists should return 404")
    void testGetMyProfile_NotFound() {
        // Arrange
        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(testUserId);
            when(profileService.getCurrentUserProfile(testUserId)).thenReturn(null);

            // Act & Assert
            assertThrows(com.profiling.exception.NotFoundException.class, () -> {
                profileController.getMyProfile();
            });

            verify(profileService).getCurrentUserProfile(testUserId);
        }
    }

    // TC-VIEW-005: Get Profile by ID - Valid ID
    @Test
    @DisplayName("TC-VIEW-005: Get profile by ID should succeed")
    void testGetProfile_ValidId_Success() {
        // Arrange
        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(testUserId);
            when(profileService.getProfileById(testProfileId, testUserId))
                    .thenReturn(Optional.of(testProfile));

            // Act
            ResponseEntity<Profile> response = profileController.getProfile(testProfileId);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(testProfileId, response.getBody().getId());
            verify(profileService).getProfileById(testProfileId, testUserId);
        }
    }

    // TC-DOWNLOAD-001: Download Profile as PDF - Valid Profile
    @Test
    @DisplayName("TC-DOWNLOAD-001: Download profile as PDF should succeed")
    void testDownloadProfile_Success() {
        // Arrange
        byte[] pdfBytes = "PDF content".getBytes();
        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(testUserId);
            when(profileService.getProfileById(testProfileId, testUserId))
                    .thenReturn(Optional.of(testProfile));
            when(profileService.generateTemplate(testProfile))
                    .thenReturn(new TemplateRenderResult(null, "Template"));
            when(pdfService.generateProfilePDF(any(Profile.class), any(TemplateRenderResult.class)))
                    .thenReturn(pdfBytes);

            // Act
            ResponseEntity<byte[]> response = profileController.downloadProfile(testProfileId);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(pdfBytes, response.getBody());
            assertEquals("application/pdf", response.getHeaders().getContentType().toString());
        }
    }

    // TC-FORM-013: Resume Parsing - Valid PDF
    @Test
    @DisplayName("TC-FORM-013: Parse resume PDF should succeed")
    void testParseResume_ValidPDF_Success() {
        // Arrange
        MultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "PDF content".getBytes());
        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(testUserId);
            try {
                doReturn(null).when(resumeParserService).parseResume(file); // Mock DTO
            } catch (IOException e) {
                // Ignore - this won't happen with mocked method
            }

            // Act
            ResponseEntity<ApiResponse> response = profileController.parseResume(file);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            try {
                verify(resumeParserService).parseResume(file);
            } catch (IOException e) {
                // Ignore - verification doesn't throw in mocked context
            }
        }
    }

    // TC-FORM-016: Resume Parsing - Empty File
    @Test
    @DisplayName("TC-FORM-016: Parse empty resume should fail")
    void testParseResume_EmptyFile_ThrowsException() {
        // Arrange
        MultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.pdf", "application/pdf", new byte[0]);
        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(testUserId);

            // Act & Assert
            BadRequestException exception = assertThrows(BadRequestException.class, () -> {
                profileController.parseResume(emptyFile);
            });

            assertEquals("Resume file is required", exception.getMessage());
        }
    }

    // TC-ENHANCE-001: Enhance Profile with Report - Valid Data
    @Test
    @DisplayName("TC-ENHANCE-001: Enhance profile with report should succeed")
    void testEnhanceProfileWithReport_Success() {
        // Arrange
        EnhanceProfileRequest request = new EnhanceProfileRequest();
        request.setProfileId(testProfileId);
        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(testUserId);
            when(profileService.enhanceProfileWithReport(request, testUserId))
                    .thenReturn(testProfileResponse);

            // Act
            ResponseEntity<ApiResponse> response = 
                    profileController.enhanceProfileWithReport(request);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(profileService).enhanceProfileWithReport(request, testUserId);
        }
    }

    // TC-AUTH-014: Data Isolation - User Cannot Access Another User's Profile
    @Test
    @DisplayName("TC-AUTH-014: User cannot access another user's profile")
    void testGetProfile_DifferentUser_Returns404() {
        // Arrange
        String otherUserId = "other-user";
        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(otherUserId);
            when(profileService.getProfileById(testProfileId, otherUserId))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(com.profiling.exception.NotFoundException.class, () -> {
                profileController.getProfile(testProfileId);
            });

            verify(profileService).getProfileById(testProfileId, otherUserId);
        }
    }
}

