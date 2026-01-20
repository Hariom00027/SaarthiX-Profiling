package com.profiling.controller;

import com.profiling.dto.ApiResponse;
import com.profiling.exception.BadRequestException;
import com.profiling.exception.NotFoundException;
import com.profiling.exception.UnauthorizedException;
import com.profiling.model.User;
import com.profiling.model.UserRole;
import com.profiling.security.SecurityUtils;
import com.profiling.service.FileStorageService;
import com.profiling.template.TemplateEntity;
import com.profiling.template.TemplateService;
import com.profiling.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/templates")
public class AdminTemplateController {

    private final TemplateService templateService;
    private final AuthService authService;
    private final FileStorageService fileStorageService;
    private static final Logger log = LoggerFactory.getLogger(AdminTemplateController.class);

    @Autowired
    public AdminTemplateController(TemplateService templateService, AuthService authService, FileStorageService fileStorageService) {
        this.templateService = templateService;
        this.authService = authService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> listTemplates() {
        ensureAdmin();
        List<TemplateEntity> templates = templateService.listAllDefaultTemplates();
        log.info("Admin retrieved {} global templates", templates.size());
        ApiResponse response = new ApiResponse("Templates retrieved successfully", templates);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse> createTemplate(@RequestBody TemplateEntity template) {
        ensureAdmin();
        TemplateEntity created = templateService.saveGlobalTemplate(template);
        log.info("Admin created template {}", created.getId());
        ApiResponse response = new ApiResponse("Template created successfully", created);
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @PutMapping("/{type}")
    public ResponseEntity<ApiResponse> updateTemplate(@PathVariable String type, @RequestBody TemplateEntity template) {
        ensureAdmin();
        TemplateEntity updated = templateService.updateGlobalTemplate(type, template);
        log.info("Admin updated template {}", updated.getId());
        ApiResponse response = new ApiResponse("Template updated successfully", updated);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @DeleteMapping("/{type}")
    public ResponseEntity<ApiResponse> deleteTemplate(@PathVariable String type) {
        ensureAdmin();
        templateService.deleteGlobalTemplate(type);
        log.info("Admin deleted template {}", type);
        ApiResponse response = new ApiResponse("Template deleted successfully", null);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }

    /**
     * POST endpoint for admin to upload preview image for a global template
     * @param templateId The template ID
     * @param file The image file to upload
     * @return Updated template with previewImageUrl
     */
    @PostMapping(value = "/uploadPreview/{templateId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse> uploadPreviewImage(
            @PathVariable String templateId,
            @RequestPart("file") MultipartFile file) {
        
        ensureAdmin();

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }

        try {
            // Store the file
            String previewImageUrl = fileStorageService.storeFile(file, "previews");
            
            // Get global template
            TemplateEntity template = templateService.getTemplateByType(templateId, null)
                    .orElseThrow(() -> new NotFoundException("Template with id '" + templateId + "' not found."));
            
            // Ensure it's a global template (userId is null)
            if (template.getUserId() != null) {
                throw new BadRequestException("Cannot upload preview for user template via admin endpoint");
            }
            
            // Delete old preview image if exists
            if (template.getPreviewImageUrl() != null && !template.getPreviewImageUrl().isEmpty()) {
                fileStorageService.deleteFile(template.getPreviewImageUrl());
            }
            
            // Update template with preview image URL
            template.setPreviewImageUrl(previewImageUrl);
            TemplateEntity updated = templateService.updateGlobalTemplate(templateId, template);
            
            log.info("Admin uploaded preview image for template {}: {}", templateId, previewImageUrl);
            ApiResponse response = new ApiResponse("Preview image uploaded successfully", updated);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
            
        } catch (NotFoundException | BadRequestException e) {
            log.error("Failed to upload preview image for template {}: {}", templateId, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Failed to upload preview image for template {}: {}", templateId, e.getMessage(), e);
            throw new BadRequestException("Failed to upload preview image: " + e.getMessage());
        }
    }

    private void ensureAdmin() {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Admin endpoint accessed without authentication");
            throw new UnauthorizedException("Authentication required");
        }

        User currentUser = authService.getCurrentUser(userId);
        if (currentUser == null || currentUser.getRole() == null
                || !currentUser.getRole().equalsIgnoreCase(UserRole.ADMIN)) {
            log.warn("Admin endpoint access denied for userId={}", userId);
            throw new UnauthorizedException("Admin access required");
        }
    }
}

