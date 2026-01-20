package com.profiling.controller;

import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.ProfileRequestDTO;
import com.profiling.dto.RegenerateProfileRequest;
import com.profiling.dto.ResumeDataDTO;
import com.profiling.dto.EnhanceProfileRequest;
import com.profiling.dto.EnhanceParagraphWithReportRequest;
import com.profiling.exception.BadRequestException;
import com.profiling.model.Profile;
import com.profiling.model.ProfileResponse;
import com.profiling.exception.NotFoundException;
import com.profiling.exception.UnauthorizedException;
import com.profiling.security.SecurityUtils;
import com.profiling.service.PDFService;
import com.profiling.service.OpenAIService;
import com.profiling.service.ProfileService;
import com.profiling.service.ResumeParserService;
import com.profiling.template.TemplateRenderResult;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestPart;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService profileService;
    private final PDFService pdfService;
    private final ResumeParserService resumeParserService;
    private final OpenAIService openAIService;
    private static final Logger log = LoggerFactory.getLogger(ProfileController.class);

    @Autowired
    public ProfileController(ProfileService profileService,
                             PDFService pdfService,
                             ResumeParserService resumeParserService,
                             OpenAIService openAIService) {
        this.profileService = profileService;
        this.pdfService = pdfService;
        this.resumeParserService = resumeParserService;
        this.openAIService = openAIService;
    }

    /**
     * POST endpoint to create a new profile
     * @param profile The profile data from request body
     * @return The saved profile and generated template as JSON
     */
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> createProfile(@RequestBody Profile profile) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to create profile without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        ProfileResponse profileResponse = profileService.saveProfile(profile, userId);
        log.info("Profile created successfully for userId={} profileId={}", userId,
                profileResponse.getProfile() != null ? profileResponse.getProfile().getId() : null);
        
        ApiResponse response = new ApiResponse("Profile created successfully", profileResponse);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }

    /**
     * GET endpoint to retrieve the current user's saved profile
     * @return The profile with template as JSON if found, 404 if not found
     */
    @GetMapping(value = "/my-profile", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> getMyProfile() {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to fetch profile without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        ProfileResponse profileResponse = profileService.getCurrentUserProfile(userId);
        
        if (profileResponse == null) {
            log.warn("No saved profile found for userId={}", userId);
            throw new NotFoundException("No saved profile found");
        }
        
        log.info("Profile fetched successfully for userId={}", userId);
        ApiResponse response = new ApiResponse("Profile retrieved successfully", profileResponse);
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }

    /**
     * GET endpoint to retrieve all saved profiles for the current user (up to 3 most recent)
     * @return List of profiles with templates as JSON
     */
    @GetMapping(value = "/my-profiles", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> getAllMyProfiles() {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to fetch profiles without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        java.util.List<ProfileResponse> profileResponses = profileService.getAllUserProfiles(userId);
        
        log.info("Retrieved {} profiles for userId={}", profileResponses.size(), userId);
        ApiResponse response = new ApiResponse("Profiles retrieved successfully", profileResponses);
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }

    /**
     * GET endpoint to retrieve a profile by ID
     * @param id The profile ID
     * @return The profile as JSON if found, 404 if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<Profile> getProfile(@PathVariable String id) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to fetch profile {} without authentication", id);
            throw new UnauthorizedException("User must be authenticated");
        }

        Optional<Profile> profile = profileService.getProfileById(id, userId);
        
        if (profile.isPresent()) {
            log.info("Profile {} retrieved for userId={}", id, userId);
            return new ResponseEntity<>(profile.get(), HttpStatus.OK);
        } else {
            log.warn("Profile {} not found for userId={}", id, userId);
            throw new NotFoundException("Profile not found");
        }
    }

    @GetMapping(value = "/{id}/download", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadProfile(@PathVariable String id) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to download profile {} without authentication", id);
            throw new UnauthorizedException("User must be authenticated");
        }

        Optional<Profile> profileOptional = profileService.getProfileById(id, userId);

        if (profileOptional.isEmpty()) {
            log.warn("Profile {} not found for userId={} during PDF download", id, userId);
            throw new NotFoundException("Profile not found");
        }

        Profile profile = profileOptional.get();
        TemplateRenderResult renderResult = profileService.generateTemplate(profile);
        byte[] pdfBytes = pdfService.generateProfilePDF(profile, renderResult);
        log.info("Profile PDF generated for userId={} profileId={}", userId, profile.getId());

        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        "Content-Disposition",
                        ContentDisposition.attachment().filename("profile.pdf").build().toString()
                )
                .body(pdfBytes);
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> updateProfile(@PathVariable String id,
                                                     @RequestBody ProfileRequestDTO requestDTO) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to update profile {} without authentication", id);
            throw new UnauthorizedException("User must be authenticated");
        }

        Profile updatedProfile = profileService.updateProfile(id, requestDTO, userId);
        TemplateRenderResult renderResult = profileService.generateTemplate(updatedProfile);
        ProfileResponse responseData = new ProfileResponse(updatedProfile, renderResult);
        log.info("Profile {} updated for userId={}", id, userId);

        ApiResponse response = new ApiResponse("Profile updated successfully", responseData);
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }


    /**
     * POST endpoint to save profile as JSON file
     * @param id The profile ID
     * @return Success message with JSON file path
     */
    @PostMapping(value = "/{id}/save-json", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> saveProfileAsJson(@PathVariable String id) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to save profile {} as JSON without authentication", id);
            throw new UnauthorizedException("User must be authenticated");
        }

        String jsonPath = profileService.saveProfileAsJson(id, userId);
        log.info("Profile {} saved as JSON for userId={}, path={}", id, userId, jsonPath);
        ApiResponse response = new ApiResponse("Profile saved as JSON successfully", Map.of("jsonPath", jsonPath));
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }

    /**
     * POST endpoint to parse resume and extract data
     * @param file The resume file (PDF or DOCX)
     * @return Extracted resume data as JSON
     */
    @PostMapping(value = "/parse-resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> parseResume(@RequestPart("file") MultipartFile file) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to parse resume without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Resume file is required");
        }

        try {
            log.info("Parsing resume for userId={}, filename={}", userId, file.getOriginalFilename());
            ResumeDataDTO resumeData = resumeParserService.parseResume(file);
            log.info("Resume parsed successfully for userId={}", userId);
            
            ApiResponse response = new ApiResponse("Resume parsed successfully", resumeData);
            return ResponseEntity
                    .ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (IllegalArgumentException e) {
            log.error("Invalid resume file for userId={}: {}", userId, e.getMessage());
            throw new BadRequestException(e.getMessage());
        } catch (Exception e) {
            log.error("Error parsing resume for userId={}: {}", userId, e.getMessage(), e);
            throw new BadRequestException("Failed to parse resume: " + e.getMessage());
        }
    }

    /**
     * POST endpoint to parse profile PDF file
     * @param file The profile PDF file to parse
     * @return The parsed profile data as JSON
     */
    @PostMapping(value = "/parse-profile-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> parseProfilePdf(@RequestParam("file") MultipartFile file) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to parse profile PDF without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        if (file.isEmpty()) {
            log.warn("Empty profile PDF file uploaded by userId={}", userId);
            throw new BadRequestException("Profile file is required");
        }

        try {
            log.info("Parsing profile PDF for userId={}", userId);
            ResumeDataDTO profileData = resumeParserService.parseProfilePdf(file);
            
            ApiResponse response = new ApiResponse("Profile PDF parsed successfully", profileData);
            return ResponseEntity
                    .ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (IllegalArgumentException e) {
            log.error("Invalid profile PDF file for userId={}: {}", userId, e.getMessage());
            throw new BadRequestException(e.getMessage());
        } catch (Exception e) {
            log.error("Error parsing profile PDF for userId={}: {}", userId, e.getMessage(), e);
            throw new BadRequestException("Failed to parse profile PDF: " + e.getMessage());
        }
    }

    /**
     * POST endpoint to enhance profile with psychometric report data
     * @param request The enhance profile request containing profile and report data
     * @return The enhanced profile with updated template as JSON
     */
    @PostMapping(value = "/enhance-with-report", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> enhanceProfileWithReport(@RequestBody EnhanceProfileRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to enhance profile without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        try {
            ProfileResponse enhancedProfile = profileService.enhanceProfileWithReport(request, userId);
            log.info("Profile enhanced successfully with report data for userId={} profileId={}", 
                    userId, enhancedProfile.getProfile().getId());
            
            ApiResponse response = new ApiResponse("Profile enhanced successfully", enhancedProfile);
            return ResponseEntity
                    .ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            log.error("Failed to enhance profile for userId={}: {}", userId, e.getMessage(), e);
            throw new BadRequestException("Failed to enhance profile: " + e.getMessage());
        }
    }

    /**
     * POST endpoint to enhance a single uploaded profile paragraph with psychometric report insights.
     * This is used by the psychometric "Upload Profile -> Preview -> Enhance with report" flow.
     */
    @PostMapping(value = "/enhance-paragraph-with-report", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> enhanceParagraphWithReport(@RequestBody EnhanceParagraphWithReportRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to enhance uploaded paragraph without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            throw new BadRequestException("Uploaded paragraph text is required");
        }
        if (request.getReportData() == null || request.getReportData().isEmpty()) {
            throw new BadRequestException("Report data is required");
        }

        try {
            String reportInsights = extractReportInsights(request.getReportData());
            String enhanced = openAIService.enhanceParagraphWithReport(request.getText(), reportInsights);

            ApiResponse response = new ApiResponse("Paragraph enhanced successfully", Map.of(
                    "originalText", request.getText(),
                    "enhancedText", enhanced,
                    "sessionId", request.getSessionId()
            ));
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            log.error("Failed to enhance paragraph for userId={}: {}", userId, e.getMessage(), e);
            throw new BadRequestException("Failed to enhance paragraph: " + e.getMessage());
        }
    }

    private String extractReportInsights(Map<String, Object> reportData) {
        StringBuilder insights = new StringBuilder();

        Object strengthsObj = reportData.get("strengths");
        if (strengthsObj instanceof java.util.List<?>) {
            @SuppressWarnings("unchecked")
            java.util.List<Object> strengths = (java.util.List<Object>) strengthsObj;
            if (!strengths.isEmpty()) {
                insights.append("STRENGTHS:\n");
                for (Object s : strengths) {
                    if (s != null && !s.toString().trim().isEmpty()) {
                        insights.append("- ").append(s.toString().trim()).append("\n");
                    }
                }
                insights.append("\n");
            }
        }

        // Fit Analysis (sometimes users say "FIR analysis" but the key is fitAnalysis in the app)
        Object fitAnalysisObj = reportData.get("fitAnalysis");
        if (fitAnalysisObj instanceof String) {
            String fitAnalysis = ((String) fitAnalysisObj).trim();
            if (!fitAnalysis.isEmpty()) {
                insights.append("FIT ANALYSIS:\n").append(fitAnalysis).append("\n\n");
            }
        }

        Object behavioralInsightsObj = reportData.get("behavioralInsights");
        if (behavioralInsightsObj instanceof String) {
            String behavioralInsights = ((String) behavioralInsightsObj).trim();
            if (!behavioralInsights.isEmpty()) {
                insights.append("BEHAVIORAL INSIGHTS:\n").append(behavioralInsights).append("\n\n");
            }
        }

        return insights.toString().trim();
    }
}

