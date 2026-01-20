package com.profiling.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private final Path uploadDir;

    public FileStorageService(@Value("${file.upload.dir:./uploads}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
            log.info("File upload directory initialized: {}", this.uploadDir);
        } catch (IOException e) {
            log.error("Failed to create upload directory: {}", this.uploadDir, e);
            throw new RuntimeException("Failed to initialize file storage", e);
        }
    }

    /**
     * Store a file and return the URL path
     * @param file The multipart file to store
     * @param subdirectory Optional subdirectory (e.g., "previews")
     * @return The URL path to access the file
     * @throws IOException if file storage fails
     */
    public String storeFile(MultipartFile file, String subdirectory) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + extension;

        // Create subdirectory if specified
        Path targetDir = subdirectory != null && !subdirectory.isEmpty() 
            ? this.uploadDir.resolve(subdirectory)
            : this.uploadDir;
        
        Files.createDirectories(targetDir);

        // Save file
        Path targetPath = targetDir.resolve(filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Return URL path (relative to uploads directory)
        String urlPath = subdirectory != null && !subdirectory.isEmpty()
            ? "/uploads/" + subdirectory + "/" + filename
            : "/uploads/" + filename;

        log.info("File stored successfully: {}", urlPath);
        return urlPath;
    }

    /**
     * Delete a file by its URL path
     * @param urlPath The URL path of the file to delete
     * @return true if file was deleted, false if it didn't exist
     */
    public boolean deleteFile(String urlPath) {
        try {
            // Remove leading slash and "uploads/" prefix if present
            String relativePath = urlPath.startsWith("/uploads/") 
                ? urlPath.substring("/uploads/".length())
                : urlPath.startsWith("/") ? urlPath.substring(1) : urlPath;
            
            Path filePath = this.uploadDir.resolve(relativePath);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("File deleted successfully: {}", urlPath);
                return true;
            }
            return false;
        } catch (IOException e) {
            log.error("Failed to delete file: {}", urlPath, e);
            return false;
        }
    }

    public Path getUploadDir() {
        return uploadDir;
    }
}



