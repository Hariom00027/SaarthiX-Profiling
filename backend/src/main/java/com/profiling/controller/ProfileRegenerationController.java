package com.profiling.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.profiling.dto.ApiResponse;
import com.profiling.dto.RegenerateProfileRequest;
import com.profiling.exception.UnauthorizedException;
import com.profiling.model.ProfileResponse;
import com.profiling.security.SecurityUtils;
import com.profiling.service.ProfileService;

@RestController
@RequestMapping("/api/profile")
public class ProfileRegenerationController {

    private final ProfileService profileService;
    private static final Logger log = LoggerFactory.getLogger(ProfileRegenerationController.class);

    @Autowired
    public ProfileRegenerationController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @PostMapping(value = "/regenerate", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> regenerateProfile(@RequestBody RegenerateProfileRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Regenerate attempt without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        if (request != null && StringUtils.hasText(request.getUserId()) && !request.getUserId().equals(userId)) {
            log.warn("Regenerate request userId mismatch ({} vs {})", request.getUserId(), userId);
            throw new UnauthorizedException("You are not authorized to regenerate this profile");
        }

        ProfileResponse profileResponse = profileService.regenerateProfile(request, userId);
        log.info("Profile regenerated for userId={}", userId);
        ApiResponse response = new ApiResponse("Profile regenerated successfully", profileResponse);
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }
}


