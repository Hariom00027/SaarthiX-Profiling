package com.profiling.controller;

import java.util.List;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.profiling.dto.ApiResponse;
import com.profiling.exception.BadRequestException;
import com.profiling.exception.NotFoundException;
import com.profiling.exception.UnauthorizedException;
import com.profiling.security.SecurityUtils;
import com.profiling.service.FileStorageService;
import com.profiling.template.TemplateEntity;
import com.profiling.template.TemplateService;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final TemplateService templateService;
    private final FileStorageService fileStorageService;
    private static final Logger log = LoggerFactory.getLogger(TemplateController.class);

    @Autowired
    public TemplateController(TemplateService templateService, FileStorageService fileStorageService) {
        this.templateService = templateService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/default")
    public ResponseEntity<ApiResponse> listDefaultTemplates() {
        List<TemplateEntity> templates = templateService.listDefaultTemplates();
        log.info("Default templates retrieved");
        ApiResponse response = new ApiResponse("Default templates retrieved successfully", templates);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @GetMapping("/custom")
    public ResponseEntity<ApiResponse> listCustomTemplates() {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to list custom templates without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        List<TemplateEntity> templates = templateService.listCustomTemplates(userId);
        log.info("Custom templates retrieved for userId={}", userId);
        ApiResponse response = new ApiResponse("Custom templates retrieved successfully", templates);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse> listAllTemplates() {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to list templates without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        List<TemplateEntity> templates = templateService.listAllTemplatesForUser(userId);
        log.info("All templates retrieved for userId={}", userId);
        ApiResponse response = new ApiResponse("Templates retrieved successfully", templates);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }

    /**
     * GET endpoint to retrieve all templates (including previewImageUrl)
     * This endpoint is accessible without authentication for public template listing
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse> getAllTemplates() {
        List<TemplateEntity> templates = templateService.listDefaultTemplates();
        log.info("All templates retrieved (public)");
        ApiResponse response = new ApiResponse("Templates retrieved successfully", templates);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }

    /**
     * POST endpoint to upload preview image for a template
     * @param templateId The template ID
     * @param file The image file to upload
     * @return Updated template with previewImageUrl
     */
    @PostMapping(value = "/uploadPreview/{templateId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse> uploadPreviewImage(
            @PathVariable String templateId,
            @RequestPart("file") MultipartFile file) {
        
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to upload preview image without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }

        try {
            // Store the file
            String previewImageUrl = fileStorageService.storeFile(file, "previews");
            
            // Get template - try user template first, then global template
            TemplateEntity template = templateService.getTemplateByType(templateId, userId)
                    .orElseThrow(() -> new NotFoundException("Template with id '" + templateId + "' not found."));
            
            // Delete old preview image if exists
            if (template.getPreviewImageUrl() != null && !template.getPreviewImageUrl().isEmpty()) {
                fileStorageService.deleteFile(template.getPreviewImageUrl());
            }
            
            // Update template with preview image URL
            template.setPreviewImageUrl(previewImageUrl);
            TemplateEntity updated;
            
            // Check if it's a user template or global template
            if (template.getUserId() != null && template.getUserId().equals(userId)) {
                updated = templateService.updateTemplate(templateId, template, userId);
            } else {
                // For global templates, we need admin access - this will be handled in AdminTemplateController
                throw new UnauthorizedException("Only template owner or admin can update preview image");
            }
            
            log.info("Preview image uploaded for template {}: {}", templateId, previewImageUrl);
            ApiResponse response = new ApiResponse("Preview image uploaded successfully", updated);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
            
        } catch (UnauthorizedException | NotFoundException e) {
            log.error("Failed to upload preview image for template {}: {}", templateId, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Failed to upload preview image for template {}: {}", templateId, e.getMessage(), e);
            throw new BadRequestException("Failed to upload preview image: " + e.getMessage());
        }
    }

    @GetMapping("/{type}")
    public ResponseEntity<ApiResponse> getTemplate(@PathVariable String type) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to fetch template {} without authentication", type);
            throw new UnauthorizedException("User must be authenticated");
        }

        return templateService.getTemplateByType(type, userId)
                .map(template -> {
                    log.info("Template {} retrieved for userId={}", type, userId);
                    ApiResponse response = new ApiResponse("Template retrieved successfully", template);
                    return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
                })
                .orElseThrow(() -> new NotFoundException("Template with type '" + type + "' not found."));
    }

    @PostMapping("/create")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ApiResponse> createTemplate(@RequestBody TemplateEntity template) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to create template without authentication");
            throw new UnauthorizedException("User must be authenticated");
        }

        TemplateEntity savedTemplate = templateService.saveTemplate(template, userId);
        log.info("Template {} created for userId={}", savedTemplate.getId(), userId);
        ApiResponse response = new ApiResponse("Template created successfully", savedTemplate);
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @PutMapping("/{type}")
    public ResponseEntity<ApiResponse> updateTemplate(@PathVariable String type, @RequestBody TemplateEntity template) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to update template {} without authentication", type);
            throw new UnauthorizedException("User must be authenticated");
        }

        TemplateEntity updatedTemplate = templateService.updateTemplate(type, template, userId);
        log.info("Template {} updated for userId={}", type, userId);
        ApiResponse response = new ApiResponse("Template updated successfully", updatedTemplate);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @DeleteMapping("/{type}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<ApiResponse> deleteTemplate(@PathVariable String type) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            log.warn("Attempt to delete template {} without authentication", type);
            throw new UnauthorizedException("User must be authenticated");
        }

        templateService.deleteTemplate(type, userId);
        log.info("Template {} deleted for userId={}", type, userId);
        ApiResponse response = new ApiResponse("Template deleted successfully", null);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
    }
}

