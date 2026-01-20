package com.profiling.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.profiling.model.Profile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class ProfileJsonService {
    
    private final ObjectMapper objectMapper;
    private static final Logger log = LoggerFactory.getLogger(ProfileJsonService.class);
    
    @Value("${profile.json.directory:./profiles}")
    private String jsonDirectory;
    
    public ProfileJsonService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    }
    
    /**
     * Save profile as JSON file
     * @param profile The profile to save
     * @return Path to the saved JSON file
     */
    public String saveProfileAsJson(Profile profile) throws IOException {
        if (profile == null) {
            throw new IllegalArgumentException("Profile cannot be null");
        }
        
        if (profile.getUserId() == null || profile.getUserId().isEmpty()) {
            throw new IllegalArgumentException("Profile userId cannot be null or empty");
        }
        
        log.info("Saving profile {} as JSON for userId={}", profile.getId(), profile.getUserId());
        
        try {
            // Create directory if it doesn't exist
            Path dirPath = Paths.get(jsonDirectory);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
                log.info("Created directory for profile JSON files: {}", dirPath);
            }
            
            // Delete previous JSON file for this user if exists
            try {
                deletePreviousJsonFile(profile.getUserId());
            } catch (IOException e) {
                log.warn("Failed to delete previous JSON files, continuing: {}", e.getMessage());
                // Don't fail the save if deletion fails
            }
            
            // Create filename with userId and timestamp
            String filename = String.format("profile_%s_%d.json", 
                profile.getUserId(), 
                System.currentTimeMillis());
            
            Path filePath = dirPath.resolve(filename);
            
            // Write profile to JSON file
            try {
                objectMapper.writeValue(filePath.toFile(), profile);
                log.info("Profile {} saved as JSON successfully at {}", profile.getId(), filePath);
            } catch (Exception e) {
                log.error("Failed to serialize profile {} to JSON: {}", profile.getId(), e.getMessage(), e);
                throw new IOException("Failed to serialize profile to JSON: " + e.getMessage(), e);
            }
            
            return filePath.toString();
        } catch (IOException e) {
            log.error("Failed to save profile {} as JSON: {}", profile.getId(), e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error saving profile {} as JSON: {}", profile.getId(), e.getMessage(), e);
            throw new IOException("Unexpected error saving profile as JSON: " + e.getMessage(), e);
        }
    }
    
    /**
     * Delete previous JSON files for a user
     */
    private void deletePreviousJsonFile(String userId) throws IOException {
        Path dirPath = Paths.get(jsonDirectory);
        if (!Files.exists(dirPath)) {
            return;
        }
        
        // Find and delete all JSON files for this user
        Files.list(dirPath)
            .filter(path -> path.getFileName().toString().startsWith("profile_" + userId + "_"))
            .forEach(path -> {
                try {
                    Files.delete(path);
                    log.info("Deleted previous profile JSON {}", path);
                } catch (IOException e) {
                    log.warn("Failed to delete old JSON file {}: {}", path, e.getMessage());
                }
            });
    }
}

